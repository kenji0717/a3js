const p_ui_console = window.parent.document.querySelector('#console_pre');

// 親の#console_preにconsole.log()のように
// メッセージを出す関数。"%d"とかの置換文字列には
// 対応してない。
function print_args_to_p_ui_console(...args) {
  args.forEach(arg=>{
    if (typeof arg === "string" || arg instanceof String) {
      //エラーメッセージにdata urlが表れると長すぎるので省略
      const replace = arg.replaceAll(/data:text\/javascript;base64,[^:]*/g,'Your Program');
      p_ui_console.textContent += replace;
    } else {
      p_ui_console.textContent += JSON.stringify(arg);
    }
  });
  p_ui_console.textContent += "\n";
}

// 以下、console.log,info,warn,error,debugの置き換え
console.log = function(...args) {
  print_args_to_p_ui_console(...args);
  window.parent.console.log(...args);
};
console.info = function(...args) {
  print_args_to_p_ui_console(...args);
  window.parent.console.info(...args);
};
console.warn = function(...args) {
  print_args_to_p_ui_console(...args);
  window.parent.console.warn(...args);
};
console.error = function(...args) {
  print_args_to_p_ui_console(...args);
  window.parent.console.error(...args);
};
console.debug = function(...args) {
  print_args_to_p_ui_console(...args);
  window.parent.console.debug(...args);
};

// エラーを捕捉して親の方で表示
window.addEventListener('error', function(e) {
  console.log(e.error.stack);
  e.preventDefault();
});
// 非同期のエラーはこっちで捕捉して親の方で表示
window.addEventListener('unhandledrejection', function(e) {
  console.log(e.reason.stack);
  e.preventDefault();
});
