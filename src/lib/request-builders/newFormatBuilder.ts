/**
 * 新格式请求构建器
 *
 * 用于构建Kimi新API格式的请求结构
 * 支持K1.5和K2模型的特性
 */

import logger from '@/lib/logger.ts';

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

export interface MessageBlock {
  role: string;
  content: string | Array<{
    type: string;
    [key: string]: any;
  }>;
}

/**
 * 构建新格式请求
 *
 * @param model 模型名称
 * @param messages 消息数组
 * @param options 用户选项
 * @param capabilities 模型能力
 * @returns 新格式请求对象
 */
export function buildNewFormatRequest(
  model: string,
  messages: MessageBlock[],
  options: any = {},
  capabilities: any
): NewFormatRequest {
  const isK2 = capabilities.isK2;
  const enableSearch = options.use_search !== false && capabilities.defaultSearch;

  logger.info(`构建新格式请求 - 模型: ${model}, K2: ${isK2}, 搜索: ${enableSearch}, 思考: ${options.use_thinking}`);

  const request: NewFormatRequest = {
    scenario: isK2 ? "SCENARIO_K2" : "SCENARIO_CHAT",
    message: {
      role: "user",
      blocks: formatMessagesAsBlocks(messages),
      scenario: isK2 ? "SCENARIO_K2" : "SCENARIO_CHAT"
    }
  };

  // 添加搜索工具
  if (enableSearch) {
    request.tools = [{
      type: "TOOL_TYPE_SEARCH",
      search: {}
    }];
    logger.info('添加搜索工具到请求');
  }

  // 添加长思考选项（仅K2）
  if (capabilities.supportsThinking && options.use_thinking) {
    request.options = {
      thinking: true
    };
    logger.info('启用长思考模式');
  }

  logger.debug('新格式请求构建完成:', JSON.stringify(request, null, 2));
  return request;
}

/**
 * 格式化消息为blocks格式
 *
 * @param messages 原始消息数组
 * @returns 格式化后的blocks数组
 */
function formatMessagesAsBlocks(messages: MessageBlock[]): Array<{
  message_id: string;
  text: {
    content: string;
  };
}> {
  return messages.map(msg => {
    let content = '';

    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      // 处理多模态消息（如包含图片、文件等）
      const textParts = msg.content
        .filter(part => part.type === 'text')
        .map(part => part.text || part.content);
      content = textParts.join(' ');
    }

    return {
      message_id: generateMessageId(),
      text: {
        content: content || ''
      }
    };
  });
}

/**
 * 生成消息ID
 *
 * @returns 随机消息ID
 */
function generateMessageId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 检查是否应该使用新格式
 *
 * @param model 模型名称
 * @param capabilities 模型能力
 * @returns 是否使用新格式
 */
export function shouldUseNewFormat(model: string, capabilities: any): boolean {
  // K1.5和K2模型使用新格式
  if (capabilities.supportsTools) {
    return true;
  }

  // 检查是否明确要求使用新功能
  return false;
}

/**
 * 构建兼容性请求（新旧格式自动选择）
 *
 * @param model 模型名称
 * @param messages 消息数组
 * @param options 用户选项
 * @param capabilities 模型能力
 * @param refs 引用文件
 * @param refsFile 引用文件详情
 * @returns 请求配置对象
 */
export function buildCompatibleRequest(
  model: string,
  messages: MessageBlock[],
  options: any = {},
  capabilities: any,
  refs: string[] = [],
  refsFile: any[] = []
) {
  const useNewFormat = shouldUseNewFormat(model, capabilities);

  if (useNewFormat) {
    // 使用新格式
    const newFormatRequest = buildNewFormatRequest(model, messages, options, capabilities);

    return {
      format: 'new',
      data: {
        kimiplus_id: capabilities.isK15 ? 'crm40ee9e5jvhsn7ptcg' : 'kimi',
        scenario: newFormatRequest.scenario,
        tools: newFormatRequest.tools,
        messages: formatMessagesForNewAPI(newFormatRequest.message.blocks),
        refs: refs,
        refs_file: refsFile,
        use_math: model.includes('math'),
        use_research: model.includes('research'),
        use_search: options.use_search,
        options: newFormatRequest.options,
        extend: { sidebar: true }
      }
    };
  } else {
    // 使用旧格式（保持兼容）
    return {
      format: 'legacy',
      data: {
        kimiplus_id: /^[0-9a-z]{20}$/.test(model) ? model : 'kimi',
        use_search: options.use_search,
        use_research: model.includes('research'),
        use_math: model.includes('math'),
        messages: messages,
        refs: refs,
        refs_file: refsFile,
        extend: { sidebar: true }
      }
    };
  }
}

/**
 * 将blocks格式转换为新API的消息格式
 *
 * @param blocks blocks数组
 * @returns 新API格式的消息数组
 */
function formatMessagesForNewAPI(blocks: Array<{
  message_id: string;
  text: {
    content: string;
  };
}>): Array<{role: string; content: string}> {
  return blocks.map(block => ({
    role: 'user',
    content: block.text.content
  }));
}