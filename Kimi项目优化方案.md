# Kimi-Free-API 项目优化方案

## 项目概述

本文档基于对Kimi API新架构的深入分析，制定了一套完整的项目优化方案，以支持K1.5和K2模型的新特性，同时保持向后兼容性。

## 🔍 关键发现总结

### 1. API架构变化

| 功能 | 旧版本API | 新版本API |
|------|-----------|-----------|
| **模型标识** | `kimiplus_id: "kimi"` | `scenario: "SCENARIO_CHAT/K2"` |
| **搜索控制** | `use_search: true/false` | `tools: [{"type":"TOOL_TYPE_SEARCH"}]` |
| **消息格式** | `messages: [{role, content}]` | `message: {blocks: [{text}]}` |
| **功能控制** | 布尔参数 | 结构化对象 |

### 2. 模型差异对比

| 模型 | Scenario | Tools | Options.thinking | 搜索默认状态 | 长思考支持 |
|------|----------|-------|------------------|--------------|------------|
| **标准Kimi** | `SCENARIO_CHAT` | ❌ 无 | ❌ 无 | 关闭 | ❌ 不支持 |
| **K1.5** | `SCENARIO_CHAT` | ✅ 可选 | `false` | 开启 | ❌ 不支持 |
| **K2** | `SCENARIO_K2` | ✅ 可选 | `true/false` | 开启 | ✅ 支持 |

### 3. 核心控制机制

- **搜索功能**：通过 `tools` 字段的存在与否控制
- **长思考模式**：仅K2支持，通过 `options.thinking: true` 控制
- **模型识别**：通过 `scenario` 和 `kimiplus_id` 共同识别

## 📋 当前项目问题分析

### 1. 实现过时 (`src/api/controllers/chat.ts`)

```javascript
// 当前实现 - 已过时
{
  kimiplus_id: "kimi",
  use_search: false,     // ❌ 旧版本参数
  use_research: false,   // ❌ 旧版本参数
  use_math: false,       // ❌ 旧版本参数
  messages: [...]        // ❌ 简单格式
}
```

### 2. 功能缺失

- ❌ 无法使用K1.5的增强搜索功能
- ❌ 无法使用K2的长思考模式
- ❌ 缺少新版本的消息格式支持
- ❌ 扩展性差，难以添加新工具

### 3. 兼容性风险

- 🔄 虽然当前仍可工作，但存在未来被弃用的风险
- 🔄 功能受限，无法体验最新的AI能力

## 🚀 优化方案设计

### 阶段一：最小侵入式改进（1-2天）

#### 1.1 添加模型检测增强

**修改文件：** `src/api/controllers/chat.ts`

```javascript
// 在现有代码中添加
function detectModelCapabilities(model) {
  const capabilities = {
    isStandard: true,
    isK15: false,
    isK2: false,
    supportsTools: false,
    supportsThinking: false,
    defaultSearch: false
  };

  if (model.includes('k2')) {
    capabilities.isStandard = false;
    capabilities.isK2 = true;
    capabilities.supportsTools = true;
    capabilities.supportsThinking = true;
    capabilities.defaultSearch = true;
  } else if (model.includes('k1.5') || model.includes('k1-5')) {
    capabilities.isStandard = false;
    capabilities.isK15 = true;
    capabilities.supportsTools = true;
    capabilities.defaultSearch = true;
  }

  return capabilities;
}
```

#### 1.2 增强请求参数解析

```javascript
// 在 createCompletionStream 函数中
const capabilities = detectModelCapabilities(model);
let { model, conversation_id: convId, messages, stream, use_search, use_thinking } = request.body;

// 智能参数推断
if (use_search === undefined) {
  use_search = capabilities.defaultSearch;
}

// K2模型的长思考模式支持
if (capabilities.supportsThinking && model.includes('k2')) {
  use_thinking = use_thinking === true;
}
```

#### 1.3 向后兼容的请求构建

```javascript
function buildCompatibleRequest(model, messages, options, capabilities) {
  const isLegacyFormat = !capabilities.supportsTools;

  if (isLegacyFormat) {
    // 使用现有旧格式
    return {
      kimiplus_id: capabilities.isK15 ? 'crm40ee9e5jvhsn7ptcg' : 'kimi',
      use_search: options.use_search,
      use_research: options.use_research,
      use_math: options.use_math,
      messages: messages
    };
  } else {
    // 使用新格式
    return buildNewFormatRequest(model, messages, options, capabilities);
  }
}
```

### 阶段二：新API格式支持（3-5天）

#### 2.1 新格式请求构建器

**新建文件：** `src/lib/request-builders/newFormatBuilder.ts`

```typescript
export interface NewFormatRequest {
  scenario: "SCENARIO_CHAT" | "SCENARIO_K2";
  tools?: Array<{
    type: "TOOL_TYPE_SEARCH";
    search?: {};
  }>;
  message: {
    role: "user";
    blocks: Array<{
      message_id: string;
      text: {
        content: string;
      };
    }>;
    scenario: "SCENARIO_CHAT" | "SCENARIO_K2";
  };
  options?: {
    thinking: boolean;
  };
}

export function buildNewFormatRequest(
  model: string,
  messages: any[],
  options: any,
  capabilities: any
): NewFormatRequest {
  const isK2 = capabilities.isK2;
  const enableSearch = options.use_search !== false && capabilities.defaultSearch;

  const request: NewFormatRequest = {
    scenario: isK2 ? "SCENARIO_K2" : "SCENARIO_CHAT",
    message: {
      role: "user",
      blocks: messages.map(msg => ({
        message_id: "",
        text: { content: typeof msg === 'string' ? msg : msg.content }
      })),
      scenario: isK2 ? "SCENARIO_K2" : "SCENARIO_CHAT"
    }
  };

  // 添加搜索工具
  if (enableSearch) {
    request.tools = [{
      type: "TOOL_TYPE_SEARCH",
      search: {}
    }];
  }

  // 添加长思考选项（仅K2）
  if (capabilities.supportsThinking && options.use_thinking) {
    request.options = {
      thinking: true
    };
  }

  return request;
}
```

#### 2.2 统一请求发送器

**新建文件：** `src/lib/request-senders/unifiedRequestSender.ts`

```typescript
export async function sendUnifiedRequest(
  method: string,
  uri: string,
  refreshToken: string,
  requestConfig: any,
  capabilities: any
) {
  const { accessToken, userId } = await acquireToken(refreshToken);

  // 根据格式选择不同的请求体构建
  let requestData, headers;

  if (capabilities.supportsTools) {
    // 新格式请求
    requestData = requestConfig.newFormat;
    headers = {
      'Content-Type': 'application/json',
      // 新格式可能需要特殊headers
    };
  } else {
    // 旧格式请求（保持兼容）
    requestData = requestConfig.legacyFormat;
    headers = {
      'Content-Type': 'application/json',
    };
  }

  const result = await axios({
    method,
    url: `${BASE_URL}${uri}`,
    data: requestData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Traffic-Id': userId,
      ...FAKE_HEADERS,
      ...headers
    },
    timeout: 15000,
    responseType: 'stream',
    validateStatus: () => true
  });

  return checkResult(result, refreshToken);
}
```

### 阶段三：API接口增强（2-3天）

#### 3.1 扩展API参数

**修改文件：** `src/api/routes/chat.ts`

```javascript
post: {
  '/completions': async (request: Request) => {
    request
      .validate('body.conversation_id', v => _.isUndefined(v) || _.isString(v))
      .validate('body.messages', _.isArray)
      .validate('headers.authorization', _.isString)
      // 新增参数验证
      .validate('body.use_thinking', v => _.isUndefined(v) || _.isBoolean(v))
      .validate('body.enable_tools', v => _.isUndefined(v) || _.isBoolean(v));

    const tokens = chat.tokenSplit(request.headers.authorization);
    const token = _.sample(tokens);

    // 解析所有参数
    let {
      model,
      conversation_id: convId,
      messages,
      stream,
      use_search,
      use_thinking,      // 新增：长思考模式
      enable_tools,      // 新增：工具系统开关
      tools_config       // 新增：工具配置
    } = request.body;

    // 智能参数处理
    const enhancedOptions = processModelOptions(model, {
      use_search,
      use_thinking,
      enable_tools,
      tools_config
    });

    if (stream) {
      const stream = await chat.createCompletionStreamEnhanced(
        model, messages, token, convId, enhancedOptions
      );
      return new Response(stream, {
        type: "text/event-stream"
      });
    } else {
      return await chat.createCompletionEnhanced(
        model, messages, token, convId, enhancedOptions
      );
    }
  }
}
```

#### 3.2 新增模型列表API

**修改文件：** `src/api/routes/models.ts`

```javascript
get: {
  '/models': async () => {
    return {
      "data": [
        // 现有模型
        {
          "id": "moonshot-v1",
          "object": "model",
          "owned_by": "kimi-free-api",
          "capabilities": {
            "search": false,
            "thinking": false,
            "tools": false
          }
        },
        // 新增K1.5支持
        {
          "id": "kimi-1.5",
          "object": "model",
          "owned_by": "kimi-free-api",
          "capabilities": {
            "search": true,
            "thinking": false,
            "tools": ["search"]
          }
        },
        // 新增K2支持
        {
          "id": "kimi-2",
          "object": "model",
          "owned_by": "kimi-free-api",
          "capabilities": {
            "search": true,
            "thinking": true,
            "tools": ["search"]
          }
        },
        // 智能体支持
        {
          "id": "kimi-agent",
          "object": "model",
          "owned_by": "kimi-free-api",
          "capabilities": {
            "search": true,
            "thinking": false,
            "tools": ["search"],
            "custom_agent": true
          }
        }
      ]
    };
  }
}
```

### 阶段四：响应流处理升级（2-3天）

#### 4.1 统一流处理器

**新建文件：** `src/lib/stream-processors/universalStreamProcessor.ts`

```typescript
export function processUniversalStream(
  model: string,
  convId: string,
  stream: any,
  capabilities: any,
  endCallback?: Function
) {
  // 检测流格式
  const isNewFormat = capabilities.supportsTools;

  if (isNewFormat) {
    return processNewFormatStream(model, convId, stream, endCallback);
  } else {
    // 保持现有流处理逻辑不变
    return createTransStream(model, convId, stream, endCallback);
  }
}

function processNewFormatStream(model: string, convId: string, stream: any, endCallback?: Function) {
  const transStream = new PassThrough();
  const created = util.unixTimestamp();

  // 新格式流处理逻辑
  const parser = createParser(event => {
    try {
      if (event.type !== "event") return;

      const result = _.attempt(() => JSON.parse(event.data));
      if (_.isError(result)) {
        throw new Error(`New format stream invalid: ${event.data}`);
      }

      // 处理新格式的事件类型
      if (result.event === 'thinking_start') {
        // 长思考开始事件
        const thinkingData = `data: ${JSON.stringify({
          id: convId,
          model,
          object: 'chat.completion.chunk',
          choices: [{
            index: 0,
            delta: { content: "🤔 正在深度思考..." },
            finish_reason: null
          }],
          created,
          thinking: true
        })}\n\n`;
        !transStream.closed && transStream.write(thinkingData);
      }
      // ... 其他新格式事件处理

    } catch (err) {
      logger.error(err);
      !transStream.closed && transStream.end('data: [DONE]\n\n');
    }
  });

  stream.on("data", buffer => parser.feed(buffer.toString()));
  stream.once("error", () => !transStream.closed && transStream.end('data: [DONE]\n\n'));
  stream.once("close", () => !transStream.closed && transStream.end('data: [DONE]\n\n'));

  return transStream;
}
```

### 阶段五：配置和测试（1-2天）

#### 5.1 配置文件增强

**修改文件：** `src/lib/config.ts`

```javascript
export const MODEL_CONFIGS = {
  'kimi': {
    scenario: 'SCENARIO_CHAT',
    supportsTools: false,
    defaultSearch: false,
    supportsThinking: false,
    kimiplusId: 'kimi'
  },
  'kimi-1.5': {
    scenario: 'SCENARIO_CHAT',
    supportsTools: true,
    defaultSearch: true,
    supportsThinking: false,
    kimiplusId: 'kimi'
  },
  'kimi-2': {
    scenario: 'SCENARIO_K2',
    supportsTools: true,
    defaultSearch: true,
    supportsThinking: true,
    kimiplusId: 'kimi'
  }
};
```

#### 5.2 单元测试

**新建文件：** `tests/modelCompatibility.test.ts`

```javascript
describe('Model Compatibility Tests', () => {
  test('Standard Kimi uses legacy format', () => {
    const capabilities = detectModelCapabilities('kimi');
    expect(capabilities.supportsTools).toBe(false);
    expect(capabilities.supportsThinking).toBe(false);
  });

  test('K1.5 uses new format with tools', () => {
    const capabilities = detectModelCapabilities('kimi-1.5');
    expect(capabilities.supportsTools).toBe(true);
    expect(capabilities.supportsThinking).toBe(false);
    expect(capabilities.defaultSearch).toBe(true);
  });

  test('K2 supports thinking mode', () => {
    const capabilities = detectModelCapabilities('kimi-2');
    expect(capabilities.supportsTools).toBe(true);
    expect(capabilities.supportsThinking).toBe(true);
  });
});
```

## 📅 实施计划

| 阶段 | 时间 | 主要任务 | 风险等级 |
|------|------|----------|----------|
| **阶段一** | 1-2天 | 最小侵入式改进，保持现有功能 | 🟢 低风险 |
| **阶段二** | 3-5天 | 新API格式支持，核心功能扩展 | 🟡 中风险 |
| **阶段三** | 2-3天 | API接口增强，参数扩展 | 🟡 中风险 |
| **阶段四** | 2-3天 | 响应流处理升级 | 🟡 中风险 |
| **阶段五** | 1-2天 | 配置优化和测试 | 🟢 低风险 |

**总计：9-15天**

## 🎯 预期收益

### 功能提升
- ✅ 支持K1.5模型的增强搜索功能
- ✅ 支持K2模型的长思考模式
- ✅ 更好的模型特性识别和控制
- ✅ 为未来新功能扩展奠定基础

### 兼容性保障
- ✅ 现有API完全向后兼容
- ✅ 渐进式升级，无破坏性变更
- ✅ 自动降级到兼容格式

### 技术债务清理
- ✅ 统一请求处理逻辑
- ✅ 提升代码可维护性
- ✅ 增强测试覆盖率

## 🚨 风险评估与应对

### 主要风险

1. **API变化风险**
   - 风险：Kimi官方API可能再次变化
   - 应对：保持灵活的适配层设计

2. **兼容性风险**
   - 风险：新格式可能破坏现有功能
   - 应对：完整的测试覆盖和渐进式部署

3. **性能风险**
   - 风险：新格式可能影响响应性能
   - 应对：性能基准测试和优化

### 回滚策略

- 保留完整的旧版本实现作为备选
- 通过配置开关控制新旧格式使用
- 实时监控API调用成功率和响应时间

## 📝 注意事项

1. **测试优先**：每个阶段完成后进行充分测试
2. **渐进部署**：建议分阶段部署到生产环境
3. **监控告警**：添加API调用监控和异常告警
4. **文档更新**：及时更新README和API文档
5. **用户通知**：提前通知用户新功能和兼容性变更

## 🔧 技术实现细节

### 关键文件修改清单

- `src/api/controllers/chat.ts` - 核心控制器增强
- `src/api/routes/chat.ts` - API路由扩展
- `src/lib/request-builders/newFormatBuilder.ts` - 新增文件
- `src/lib/request-senders/unifiedRequestSender.ts` - 新增文件
- `src/lib/stream-processors/universalStreamProcessor.ts` - 新增文件
- `src/lib/config.ts` - 配置增强
- `tests/modelCompatibility.test.ts` - 新增测试文件
- `README.md` - 文档更新

### 依赖包需求

确保项目包含以下依赖：
```json
{
  "axios": "^1.6.0",
  "lodash": "^4.17.21",
  "mime": "^4.0.0",
  "eventsource-parser": "^1.0.0"
}
```

## 🎉 总结

本优化方案通过分阶段实施，在保持完全向后兼容的前提下，为项目添加对K1.5和K2模型的完整支持。方案设计注重稳定性和可扩展性，为未来的API演进奠定了良好基础。

建议按照阶段性计划逐步实施，确保每个阶段都经过充分测试后再进行下一阶段。这样既能快速获得新功能收益，又能最大程度降低风险。

---

**文档创建时间**：2025年12月17日
**最后更新**：2025年12月17日
**维护者**：项目开发团队