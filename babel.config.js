module.exports = {
  presets: [
    [
      '@vue/app',
      {
        targets: {
          browsers: ['ie > 10', 'Chrome > 46']
        },
        useBuiltIns: 'entry',
        loose: true,
        modules: false
      }
    ]
  ]
};
