import _ from 'lodash';

import Request from '@/lib/request/Request.ts';
import Response from '@/lib/response/Response.ts';
import chat from '@/api/controllers/chat.ts';
import logger from '@/lib/logger.ts';

export default {

    prefix: '/v1/chat',

    post: {

        '/completions': async (request: Request) => {
            request
                .validate('body.conversation_id', v => _.isUndefined(v) || _.isString(v))
                .validate('body.messages', _.isArray)
                .validate('headers.authorization', _.isString)
                // 新增参数验证
                .validate('body.use_thinking', v => _.isUndefined(v) || _.isBoolean(v))
                .validate('body.enable_tools', v => _.isUndefined(v) || _.isBoolean(v));

            // refresh_token切分
            const tokens = chat.tokenSplit(request.headers.authorization);
            // 随机挑选一个refresh_token
            const token = _.sample(tokens);
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

            // 保持向后兼容：旧的use_search参数处理
            if(use_search && !model.includes('k1.5') && !model.includes('k2')) {
                model = 'kimi-search';
            }

            // 构建增强选项对象
            const enhancedOptions = {
                use_search,
                use_thinking,
                enable_tools,
                tools_config
            };

            if (stream) {
                const stream = await chat.createCompletionStreamEnhanced(model, messages, token, convId, enhancedOptions);
                return new Response(stream, {
                    type: "text/event-stream"
                });
            }
            else
                return await chat.createCompletionEnhanced(model, messages, token, convId, enhancedOptions);
        }

    }

}; 
