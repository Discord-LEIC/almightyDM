const time = require('time');

const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const logging = require('logging');

cooldown_storage = dict()
cooldown_user_storage = dict()

/**
     *
     * @param {int} interval
     */  
function CooldownFunction(interval) {
    def _decorate(fn):
    key = hash(fn)
    cooldown_storage[key] = time()

    def _wrapper(*args, **kwargs):
        now = time()
        if cooldown_storage[key] <= now:
            cooldown_storage[key] = now + interval
            return fn(*args, **kwargs)
        else:
            logging.debug('Throttling function {}'.format(fn))

        return _wrapper

    return _decorate
}

/**
     *
     * @param {int} interval
     */ 
    function CooldownUser(interval: int) {
        def _decorate(fn):
            def _wrapper(client: Client, message: Message, *args, **kwargs):
                key = hash((fn, message.author.id))
                now = time()

                if key not in cooldown_user_storage:
                    cooldown_user_storage[key] = 0

                if cooldown_user_storage[key] >= time:
                    cooldown_user_storage[key] = now + interval
                    return fn(client, message, *args, **kwargs)
                else:
                    logging.debug('Throttling user {} in {}'.format(message.author.display_name, fn))

            return _wrapper

        return _decorate
    }
