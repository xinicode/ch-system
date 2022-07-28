import { context } from '../application/application';
import { ConfigHelper } from '../config';

function getModal() {
  let messageBox = ConfigHelper.getConfigVal('messageBox');
  if (messageBox && messageBox.modal) {
    return messageBox.modal();
  }
  //兼容iview ui模式
  let vue: any = context.getCurrentVue();
  if (vue && vue.$Modal) {
    return vue.$Modal;
  }
  return null;
}
function getNotify() {
  let messageBox = ConfigHelper.getConfigVal('messageBox');
  if (messageBox && messageBox.notify) {
    return messageBox.notify();
  }
  //兼容iview ui模式
  let vue: any = context.getCurrentVue();
  if (vue && vue.$Notice) {
    return vue.$Notice;
  }
  return null;
}
function getLoadingBar() {
  let messageBox = ConfigHelper.getConfigVal('messageBox');
  if (messageBox && messageBox.loadingBar) {
    return messageBox.loadingBar();
  }
  //兼容iview ui模式
  let vue: any = context.getCurrentVue();
  if (vue && vue.$Loading) {
    return vue.$Loading;
  }
  return null;
}

export const Messager = {
  /**
   * 弹出提示信息
   * @param opts
   */
  info: function(opts: any) {
    let $Modal = getModal();
    if ($Modal) {
      if (opts && opts.noTimeout) {
        $Modal.info(opts);
      } else {
        setTimeout(function() {
          $Modal.info(opts);
        }, 300);
      }
    }
  },
  /**
   * 弹出操作成功提示
   * @param opts
   */
  success: function(opts: any) {
    let $Modal = getModal();
    if ($Modal) {
      if (opts && opts.noTimeout) {
        $Modal.success(opts);
      } else {
        setTimeout(function() {
          $Modal.success(opts);
        }, 300);
      }
    }
  },
  /**
   * 弹出警告提示
   * @param opts
   */
  warning: function(opts: any) {
    let $Modal = getModal();
    if ($Modal) {
      if (opts && opts.noTimeout) {
        $Modal.error(opts);
      } else {
        setTimeout(function() {
          $Modal.error(opts);
        }, 300);
      }
    }
  },
  /**
   * 弹出错误提示
   * @param opts
   */
  error: function(opts: any) {
    let $Modal = getModal();
    if ($Modal) {
      if (opts && opts.noTimeout) {
        $Modal.error(opts);
      } else {
        setTimeout(function() {
          $Modal.error(opts);
        }, 300);
      }
    }
  },
  /**
   * 弹出确认框
   * @param opts
   */
  confirm: function(opts: any) {
    let $Modal = getModal();
    if ($Modal) {
      $Modal.confirm(opts);
    }
  },
  /**
   * 弹出提示信息
   * @param opts
   * @param type
   */
  notice: function(opts: any, type?: string) {
    let $Notice = getNotify();
    if (type == null || typeof type == 'undefined') {
      type = 'open';
    }
    if (opts != null && typeof opts == 'string') {
      opts = {
        title: opts
      };
    }
    if ($Notice) {
      $Notice[type](opts);
    }
  },
  /**
   * 显示加载进度条
   */
  showLoading: function() {
    let $Loading = getLoadingBar();
    if ($Loading) {
      $Loading.start();
    }
  },
  /**
   * 隐藏加载进度条
   */
  hideLoading: function() {
    let $Loading = getLoadingBar();
    if ($Loading) {
      $Loading.finish();
    }
  },
  /**
   * 显示加载错误进度条
   */
  errorLoading: function() {
    let $Loading = getLoadingBar();
    if ($Loading) {
      $Loading.error();
    }
  }
};
