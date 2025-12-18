/**
 * 统一请求发送器工具函数
 *
 * 为新API格式提供请求构建工具
 * 避免循环依赖问题
 */

import logger from '@/lib/logger.ts';
import util from '@/lib/util.ts';

// 基础URL
const BASE_URL = 'https://kimi.moonshot.cn';
// 伪装headers
const FAKE_HEADERS = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Origin': BASE_URL,
  'Cookie': util.generateCookie(),
  'R-Timezone': 'Asia/Shanghai',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Priority': 'u=1, i'
};

/**
 * 检查是否应该使用新格式
 *
 * @param capabilities 模型能力
 * @returns 是否使用新格式
 */
export function shouldUseNewFormat(capabilities: any): boolean {
  return capabilities.supportsTools;
}

/**
 * 构建新格式请求体
 *
 * @param model 模型名称
 * @param messages 消息数组
 * @param options 选项
 * @param capabilities 模型能力
 * @param refs 引用文件
 * @param refsFile 引用文件详情
 * @returns 新格式请求体
 */
export function buildNewFormatRequestBody(
  model: string,
  messages: any[],
  options: any,
  capabilities: any,
  refs: string[] = [],
  refsFile: any[] = []
) {
  logger.info(`构建新格式请求 - 模型: ${model}, 场景: ${capabilities.scenario}`);

  return {
    kimiplus_id: capabilities.isK15 ? 'crm40ee9e5jvhsn7ptcg' : 'kimi',
    scenario: capabilities.scenario,
    tools: options.enable_tools && options.use_search ? [{
      type: "TOOL_TYPE_SEARCH",
      search: {}
    }] : undefined,
    messages,
    refs,
    refs_file: refsFile,
    use_math: model.includes('math'),
    use_research: model.includes('research'),
    use_search: options.use_search,
    options: capabilities.supportsThinking && options.use_thinking ? {
      thinking: true
    } : undefined,
    extend: { sidebar: true }
  };
}

/**
 * 构建旧格式请求体
 *
 * @param model 模型名称
 * @param messages 消息数组
 * @param options 选项
 * @param capabilities 模型能力
 * @param refs 引用文件
 * @param refsFile 引用文件详情
 * @returns 旧格式请求体
 */
export function buildLegacyFormatRequestBody(
  model: string,
  messages: any[],
  options: any,
  capabilities: any,
  refs: string[] = [],
  refsFile: any[] = []
) {
  logger.info(`构建旧格式请求 - 模型: ${model}`);

  return {
    kimiplus_id: capabilities.isK15 ? 'crm40ee9e5jvhsn7ptcg' : 'kimi',
    use_search: options.use_search,
    use_research: model.includes('research'),
    use_math: model.includes('math'),
    messages,
    refs,
    refs_file: refsFile,
    extend: { sidebar: true }
  };
}

/**
 * 构建基础请求配置
 *
 * @param accessToken 访问令牌
 * @param userId 用户ID
 * @returns 基础请求配置
 */
export function buildBaseRequestConfig(accessToken: string, userId: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Traffic-Id': userId,
    ...FAKE_HEADERS
  };
}