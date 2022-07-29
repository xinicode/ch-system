const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function (config, libs) {

  // 重新设置 alias
  config.resolve.alias
    .set('@', libs.resolveWorkspace('./src'))
    .set('@api', libs.resolveWorkspace('./src/api'))
    .set('libs', libs.resolveWorkspace('./module/libs'));

  // 不编译 iView Pro
  config.module
    .rule('js')
    .test(/\.jsx?$/)
    .exclude
    .add(libs.resolveWorkspace('./src/libs/iview-pro'))
    .end();

  // 排除 image
  const imagesRule = config.module.rule('images');
  imagesRule
    .test(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/)
    .exclude
    .add(libs.resolveWorkspace('./src/assets/svg'))
    .end();

  config.plugin('copy-files').use(CopyWebpackPlugin, [
    [{
      from: './module/system/org/userImportTemplate.xlsx',
      to: './modules/cmp_system'
    }]
  ]);

};