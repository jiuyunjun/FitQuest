export default defineAppConfig({
  pages: ['pages/index/index'],
  window: {
    backgroundTextStyle: 'dark',
    backgroundColor: '#14120f',
    navigationBarBackgroundColor: '#14120f',
    navigationBarTitleText: 'FitQuest',
    navigationBarTextStyle: 'white',
  },
  // 屏幕常亮由战斗页在开始时单独申请，不在这里全局开。
})
