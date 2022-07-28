export type LanguageType = 'en-US' | 'zh-CN';

export interface LocaleMessage {
  'en-US'?: any;
  'zh-CN'?: any;
  [propName: string]: any;
}

export class LocaleManager {
  private _messages: LocaleMessage = {
    'zh-CN': { locale: 'zh-CN', language: '简体中文' },
    'en-US': { locale: 'en-US', language: 'English' }
  };

  get messages(): LocaleMessage {
    return this._messages;
  }

  /**
   * 添加国际化消息配置
   * @param locale 语言，如： 'en-US' | 'zh-CN'：
   * @param localeMessages  国际化消息
   */
  addMessages(locale: string, localeMessages: { [propName: string]: any }) {
    if (this._messages[locale]) {
      Object.assign(this._messages[locale], localeMessages);
    } else {
      this._messages[locale] = localeMessages;
    }
  }

  /**
   * 添加国际化消息配置
   * @param localeMessages 国际化消息
   */
  addLocaleMessage(localeMessages: LocaleMessage) {
    for (const locale in localeMessages) {
      this.addMessages(locale, localeMessages[locale]);
    }
  }
}
