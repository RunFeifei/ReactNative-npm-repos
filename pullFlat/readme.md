# 如果native工程没有集成lottie  
1 RN工程中的package.json增加"lottie-react-native": "^2.2.5"  
2 npm install  
3 native工程中 参考http://airbnb.io/lottie/react-native/react-native.html#getting-started进行操作  
# 如果native项目集成了lottie  
1 Android工程中 集成LottieAnimationViewManager & LottiePackage,这两个文件在lib/android中  
2 IOS工程中 集成.m和.h文件,文件在lib/ios中  
# install  
RN工程中的package.json增加"pullflat": "^1.0.10"
