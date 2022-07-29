

const proxy = {};

const defaultConfig = {
  "target": 'http://10.201.63.36', 
  "changeOrigin": true, // 是否跨域
  "secure": false,
  "hostRewrite": "localhost:8080",
  // "logLevel":"info",
  // "xfwd":false
};

const serverResList = [
  '^/(?![^/]*$|modules/|images/|static/)'
];

serverResList.forEach(function (item) {
  proxy[item] = Object.assign(defaultConfig);
});

module.exports = proxy
