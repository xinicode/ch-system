import querystring from 'query-string';

function _querystring(url: string): string[] {
  let [newUrl, ...hash] = url ? url.split('#') : ['', ''];
  return [hash.join('#'), ...newUrl.split('?')];
}

function queryParse(query: string): any {
  return (query && querystring.parse(query)) || {};
}

function getQuerystring(url: string, name?: string): string {
  if (!url) return '';
  let [queryStr] = _querystring(url);
  if (!name) return queryStr || '';
  let query: any = queryParse(queryStr);
  return query[name] || '';
}

function _makeVarName(name) {
  return name.replace('@', '').replace(/[^a-z0-9]/gi, '_');
}

function _makeGlobalVarname(name) {
  return ['_$', name, '_'].join('');
}

/**
 * import module,
 * @param moduleName 模块名称，一般是npm名称，如：@fly-vue/core
 * @param version 版本号，如：1.0.0-snapshot
 */
function _importModule(moduleName, version) {
  let varName = _makeGlobalVarname(_makeVarName(moduleName));
  let mName = `./node_modules/${moduleName}/index.js`;
  try {
    let res = window[varName] && window[varName](mName);
    console.log(`${moduleName}@${version} run dll `);
    return res;
  } catch (e) {
    console.log(`${moduleName}@${version} can,t run dll `);
  }
}

function _importModuleFromScripts() {
  let scripts = document.querySelectorAll('script');
  if (scripts) {
    let src;
    for (let i = 0, len = scripts.length; i < len; i++) {
      src = scripts[i].src;
      if (src) {
        let moduleName = getQuerystring(src, 'module');
        if (moduleName) {
          let version = getQuerystring(src, 'version');
          _importModule(moduleName, version);
        }
      }
    }
  }
}

export const ImportModule = {
  importModule: _importModule,
  importModuleFromScripts: _importModuleFromScripts
};
