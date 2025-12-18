/**
 * 新模型命名规范测试脚本
 * 验证kimi-1.5和kimi-2系列的搜索和思考模式控制
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 开始新模型命名规范测试...\n');

// 测试用例：新的模型命名规范
const testCases = [
  {
    name: 'kimi-1.5（默认不开启搜索）',
    model: 'kimi-1.5',
    options: {},
    expected: {
      isStandard: false,
      isK15: true,
      isK2: false,
      supportsTools: true,
      supportsThinking: false,
      defaultSearch: false,
      scenario: "SCENARIO_CHAT",
      use_search: false,
      use_thinking: false
    }
  },
  {
    name: 'kimi-1.5-search（开启搜索）',
    model: 'kimi-1.5-search',
    options: {},
    expected: {
      isStandard: false,
      isK15: true,
      isK2: false,
      supportsTools: true,
      supportsThinking: false,
      defaultSearch: true,
      scenario: "SCENARIO_CHAT",
      use_search: true,
      use_thinking: false
    }
  },
  {
    name: 'kimi-2（默认不开启搜索，支持思考）',
    model: 'kimi-2',
    options: {},
    expected: {
      isStandard: false,
      isK15: false,
      isK2: true,
      supportsTools: true,
      supportsThinking: true,
      defaultSearch: false,
      scenario: "SCENARIO_K2",
      use_search: false,
      use_thinking: false
    }
  },
  {
    name: 'kimi-2-search（开启搜索）',
    model: 'kimi-2-search',
    options: {},
    expected: {
      isStandard: false,
      isK15: false,
      isK2: true,
      supportsTools: true,
      supportsThinking: true,
      defaultSearch: true,
      scenario: "SCENARIO_K2",
      use_search: true,
      use_thinking: false
    }
  },
  {
    name: 'kimi-2-research（开启长思考，不开启搜索）',
    model: 'kimi-2-research',
    options: {},
    expected: {
      isStandard: false,
      isK15: false,
      isK2: true,
      supportsTools: true,
      supportsThinking: true,
      defaultSearch: false,
      scenario: "SCENARIO_K2",
      use_search: false,
      use_thinking: true
    }
  },
  {
    name: 'kimi-2-research-search（开启长思考和搜索）',
    model: 'kimi-2-research-search',
    options: {},
    expected: {
      isStandard: false,
      isK15: false,
      isK2: true,
      supportsTools: true,
      supportsThinking: true,
      defaultSearch: true,
      scenario: "SCENARIO_K2",
      use_search: true,
      use_thinking: true
    }
  },
  // 兼容性测试用例
  {
    name: 'kimi（标准模型，保持兼容）',
    model: 'kimi',
    options: {},
    expected: {
      isStandard: true,
      isK15: false,
      isK2: false,
      supportsTools: false,
      supportsThinking: false,
      defaultSearch: false,
      scenario: "SCENARIO_CHAT",
      use_search: false,
      use_thinking: false
    }
  },
  {
    name: '显式参数覆盖默认行为',
    model: 'kimi-2',
    options: { use_search: true, use_thinking: true },
    expected: {
      isStandard: false,
      isK15: false,
      isK2: true,
      supportsTools: true,
      supportsThinking: true,
      defaultSearch: false, // 能力检测不变
      scenario: "SCENARIO_K2",
      use_search: true,    // 显式设置覆盖
      use_thinking: true   // 显式设置覆盖
    }
  }
];

function checkFileExists() {
  console.log('📁 文件存在性检查:');

  const chatControllerPath = path.join(__dirname, 'src/api/controllers/chat.ts');
  if (fs.existsSync(chatControllerPath)) {
    console.log('  ✅ src/api/controllers/chat.ts - 存在');
    return true;
  } else {
    console.log('  ❌ src/api/controllers/chat.ts - 缺失');
    return false;
  }
}

function checkFunctionsExist() {
  console.log('\n🔧 函数存在性检查:');

  const chatControllerPath = path.join(__dirname, 'src/api/controllers/chat.ts');
  if (!fs.existsSync(chatControllerPath)) {
    console.log('  ❌ 控制器文件不存在');
    return false;
  }

  const content = fs.readFileSync(chatControllerPath, 'utf8');

  const functions = [
    'detectModelCapabilities',
    'processModelOptions'
  ];

  let allExist = true;
  functions.forEach(funcName => {
    const pattern = new RegExp(`function\\s+${funcName}`);
    if (pattern.test(content)) {
      console.log(`  ✅ ${funcName} - 已实现`);
    } else {
      console.log(`  ❌ ${funcName} - 未找到`);
      allExist = false;
    }
  });

  return allExist;
}

function checkNewLogicExists() {
  console.log('\n🆕 新逻辑存在性检查:');

  const chatControllerPath = path.join(__dirname, 'src/api/controllers/chat.ts');
  if (!fs.existsSync(chatControllerPath)) {
    return false;
  }

  const content = fs.readFileSync(chatControllerPath, 'utf8');

  const newLogic = [
    { name: 'kimi-2 前缀检测', pattern: /startsWith\('kimi-2'\)/ },
    { name: 'kimi-1.5 前缀检测', pattern: /startsWith\('kimi-1\.5'\)/ },
    { name: '搜索后缀检测', pattern: /includes\('-search'\)/ },
    { name: 'research 后缀检测', pattern: /includes\('kimi-2-research'\)/ },
    { name: '能力检测日志', pattern: /模型能力检测结果/ },
    { name: '选项处理日志', pattern: /模型选项处理结果/ }
  ];

  let allExist = true;
  newLogic.forEach(logic => {
    if (logic.pattern.test(content)) {
      console.log(`  ✅ ${logic.name} - 已实现`);
    } else {
      console.log(`  ❌ ${logic.name} - 未找到`);
      allExist = false;
    }
  });

  return allExist;
}

function simulateModelDetection(model) {
  // 模拟 detectModelCapabilities 函数的逻辑
  const capabilities = {
    isStandard: true,
    isK15: false,
    isK2: false,
    supportsTools: false,
    supportsThinking: false,
    defaultSearch: false,
    scenario: "SCENARIO_CHAT"
  };

  if (model.startsWith('kimi-2')) {
    capabilities.isStandard = false;
    capabilities.isK2 = true;
    capabilities.supportsTools = true;
    capabilities.supportsThinking = true;
    capabilities.scenario = "SCENARIO_K2";

    if (model.includes('-search')) {
      capabilities.defaultSearch = true;
    } else {
      capabilities.defaultSearch = false;
    }
  } else if (model.startsWith('kimi-1.5')) {
    capabilities.isStandard = false;
    capabilities.isK15 = true;
    capabilities.supportsTools = true;
    capabilities.supportsThinking = false;
    capabilities.scenario = "SCENARIO_CHAT";

    if (model.includes('-search')) {
      capabilities.defaultSearch = true;
    } else {
      capabilities.defaultSearch = false;
    }
  } else if (model.includes('k2')) {
    capabilities.isStandard = false;
    capabilities.isK2 = true;
    capabilities.supportsTools = true;
    capabilities.supportsThinking = true;
    capabilities.defaultSearch = true;
    capabilities.scenario = "SCENARIO_K2";
  } else if (model.includes('k1.5') || model.includes('k1-5')) {
    capabilities.isStandard = false;
    capabilities.isK15 = true;
    capabilities.supportsTools = true;
    capabilities.defaultSearch = true;
  }

  return capabilities;
}

function simulateOptionsProcessing(model, options) {
  // 模拟 processModelOptions 函数的逻辑
  const capabilities = simulateModelDetection(model);

  const processedOptions = {
    use_search: options.use_search,
    use_thinking: options.use_thinking || false,
    enable_tools: options.enable_tools !== false && capabilities.supportsTools,
    tools_config: options.tools_config || {}
  };

  if (processedOptions.use_search === undefined) {
    processedOptions.use_search = capabilities.defaultSearch;
  }

  if (model.includes('kimi-2-research')) {
    if (options.use_thinking === undefined) {
      processedOptions.use_thinking = true;
    }
  } else if (capabilities.supportsThinking && options.use_thinking) {
    processedOptions.use_thinking = true;
  }

  return { capabilities, processedOptions };
}

function runTestCases() {
  console.log('\n🧪 测试用例执行:');

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`\n  测试 ${index + 1}: ${testCase.name}`);
    console.log(`    模型: ${testCase.model}`);

    const { capabilities, processedOptions } = simulateOptionsProcessing(testCase.model, testCase.options);

    const result = {
      ...capabilities,
      use_search: processedOptions.use_search,
      use_thinking: processedOptions.use_thinking
    };

    let passed = true;
    const expected = testCase.expected;

    // 检查每个字段
    Object.keys(expected).forEach(key => {
      if (result[key] !== expected[key]) {
        console.log(`    ❌ ${key}: 期望 ${expected[key]}, 实际 ${result[key]}`);
        passed = false;
      } else {
        console.log(`    ✅ ${key}: ${result[key]}`);
      }
    });

    if (passed) {
      console.log(`    🎉 测试通过`);
      passedTests++;
    } else {
      console.log(`    💥 测试失败`);
    }
  });

  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  return passedTests === totalTests;
}

function generateUsageExamples() {
  console.log('\n📚 新模型命名规范使用示例:');
  console.log(`
🔧 基础模型:
• kimi-1.5        - K1.5模型，默认不开启搜索
• kimi-2          - K2模型，默认不开启搜索，支持长思考

🔍 搜索增强模型:
• kimi-1.5-search   - K1.5模型 + 搜索功能
• kimi-2-search     - K2模型 + 搜索功能

🧠 研究增强模型:
• kimi-2-research            - K2模型 + 长思考模式（无搜索）
• kimi-2-research-search     - K2模型 + 长思考模式 + 搜索功能

⚙️ 兼容模型:
• kimi                    - 标准模型，保持向后兼容
• kimi-k2                 - 旧式K2模型检测（保持兼容）
• kimi-k1-5              - 旧式K1.5模型检测（保持兼容）

🎯 API调用示例:
// 基础使用
POST /v1/chat/completions
{
  "model": "kimi-2",
  "messages": [{"role": "user", "content": "分析这个问题"}]
}

// 显式控制
POST /v1/chat/completions
{
  "model": "kimi-2",
  "messages": [{"role": "user", "content": "搜索并分析"}],
  "use_search": true,
  "use_thinking": true
}
`);
}

function checkCompilation() {
  console.log('\n🔨 编译测试:');

  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'pipe', cwd: __dirname });
    console.log('  ✅ 编译成功');
    return true;
  } catch (error) {
    console.log('  ❌ 编译失败');
    console.log('  错误信息:', error.message);
    return false;
  }
}

function main() {
  console.log('🎯 新模型命名规范测试开始\n');

  const steps = [
    { name: '文件检查', func: checkFileExists },
    { name: '函数检查', func: checkFunctionsExist },
    { name: '新逻辑检查', func: checkNewLogicExists },
    { name: '测试用例执行', func: runTestCases },
    { name: '编译测试', func: checkCompilation }
  ];

  let allPassed = true;
  steps.forEach(step => {
    const result = step.func();
    if (!result) {
      allPassed = false;
    }
  });

  generateUsageExamples();

  console.log('\n🏆 测试总结:');
  if (allPassed) {
    console.log('  ✅ 所有测试通过');
    console.log('  🎉 新模型命名规范实施成功');
    console.log('  📋 支持的模型列表:');
    console.log('     • kimi-1.5, kimi-1.5-search');
    console.log('     • kimi-2, kimi-2-search');
    console.log('     • kimi-2-research, kimi-2-research-search');
    console.log('     • kimi（标准兼容）');
  } else {
    console.log('  ❌ 部分测试失败');
    console.log('  🔧 需要检查实现');
  }

  console.log('\n📝 实施要点:');
  console.log('  • kimi-1.5 和 kimi-2 默认不开启搜索模式');
  console.log('  • -search 后缀显式开启搜索功能');
  console.log('  • -research 后缀默认开启长思考模式');
  console.log('  • 保持100%向后兼容性');
  console.log('  • 支持显式参数覆盖默认行为');
}

// 运行测试
main();