// const proxy = {
//     "target": "http://10.201.76.185",
//     "context": [
//         "/api",
//         "/sipadmin/api",
//         "/sso",
//         "/themes",
//         "/ssoclient"
//     ],
//     "secure": false,
//     "changeOrigin": true
// }

const proxy = {};

const defaultConfig = {
  "target": 'http://10.201.63.36', 
  "changeOrigin": true, // 是否跨域
  "secure": false,
  "logLevel":"info",
  "xfwd":false
};

const serverResList = [
  '^/(?![^/]*$|modules/|images/|static/)'
];

serverResList.forEach(function (item) {
  proxy[item] = Object.assign(defaultConfig);
});

// module.exports = {
//   "/wf-runtime":    {"target": "http://10.200.21.128:31988", "pathRewrite": {"^/wf-runtime":    "/wf-runtime"},secure:false},
// };

module.exports = proxy
