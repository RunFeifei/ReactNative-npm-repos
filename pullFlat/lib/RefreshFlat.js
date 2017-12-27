import React, {Component} from 'react';
import {Animated, Easing, FlatList, PanResponder, Platform, StyleSheet, View,Dimensions} from 'react-native';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import LottieView from './LottieView';
const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');


const pull_init = 0;
const pull_start = 1;
const pull_to_refresh = 2;
const pull_refresh_ing = 3;

export default class RefreshFlat extends Component {
    constructor(props) {
        super(props);
        this.pullable = this.props.refreshControl == null;
        this.topIndicatorHeight = 100;
        this.defaultXY = {x: 0, y: this.topIndicatorHeight * -1};
        this.duration = 300;
        this.dataList = this.props.dataList || [];
        this.renderItem = this.props.renderItem || new Error('renderItem can not be undefined')
        this.state = {
            status: pull_init,
            pullPan: new Animated.ValueXY(this.defaultXY),
            scrollEnabled: false,
            progress: 0,
        };
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (e, gesture) => this.onShouldSetPanResponder(e, gesture),
            onMoveShouldSetPanResponder: (e, gesture) => this.onShouldSetPanResponder(e, gesture),
            onPanResponderMove: (e, gesture) => this.onPanResponderMove(e, gesture),
            onPanResponderRelease: (e, gesture) => this.onPanResponderRelease(e, gesture),
            onPanResponderTerminate: (e, gesture) => this.onPanResponderRelease(e, gesture),
            onStartShouldSetResponderCapture: (e, gesture) => this.onStartShouldSetResponderCapture(e, gesture),
            onMoveShouldSetResponderCapture: (e, gesture) => this.onStartShouldSetResponderCapture(e, gesture),
        });
    }

    static onStartShouldSetResponderCapture() {
        return true
    }

    onShouldSetPanResponder(e, gesture) {
        if (!this.pullable || !this.isVerticalGesture(gesture.dx, gesture.dy) || this.state.status === pull_refresh_ing || this.state.scrollEnabled) {
            return false;
        }
        this.lastY = this.state.pullPan.y._value;
        let gestureOffsetY = gesture.dy;
        let moveY = this.lastY + gestureOffsetY;
        return moveY < this.topIndicatorHeight
    }

    onPanResponderMove(e, gesture) {
        let gestureOffsetY = gesture.dy / 2;
        let moveY = this.lastY + gestureOffsetY;
        if (this.isUpGesture(gesture.dx, gesture.dy)) {
            this.scroll.scrollToOffset({
                animated: true,
                offset: gesture.dy * -1
            });
            return;
        }
        if (this.isDownGesture(gesture.dx, gesture.dy)) {
            if (gestureOffsetY < this.topIndicatorHeight) {
                this.state.pullPan.setValue({x: this.defaultXY.x, y: moveY});
                if (this.state.status !== pull_start) {
                    this.props.onRefreshStart && this.props.onRefreshStart();
                }
                this.setState({status: pull_start});
                const progress = 1 - (moveY / this.topIndicatorHeight) * -1;
                if (progress > 0.95) {
                    this.setState({progress: 1.0, status: pull_to_refresh});
                } else {
                    this.setState({progress: progress});
                }
            } else if (moveY >= 0) {
                this.setState({progress: 1.0, status: pull_to_refresh});
            }
        }
    }

    onPanResponderRelease(e, gesture) {
        if (this.state.status === pull_start) { //没有下拉到位
            this.resetBack(); //重置状态
            return;
        }
        if (this.state.status === pull_to_refresh) {
            this.setState({status: pull_refresh_ing}, () => {
                //need double play!!!
                this.refreshingLottie.play();
                this.refreshingLottie.play();
                this.props.onRefreshIng && this.props.onRefreshIng();

                this.timer && clearTimeout(this.timer)
                this.timer = setTimeout(() => {
                    this.reset()
                }, 10000)
            });
        }
    }

    /**
     * 用来判断是否需要下拉
     */
    onScroll(e) {
        if (e.nativeEvent.contentOffset.y <= 0) {
            this.setState({scrollEnabled: false});
            return;
        }
        if (this.state.status === pull_init) {
            this.setState({scrollEnabled: true});
        }
    }

    isDownGesture = (x, y) => {
        return y > 0 && (y > Math.abs(x));
    };
    isUpGesture = (x, y) => {
        return y < 0 && (Math.abs(x) < Math.abs(y));
    };
    isVerticalGesture = (x, y) => {
        return (Math.abs(x) < Math.abs(y));
    };

    onLayout(e) {
        this.setState({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
        })
    }

    isAndroid() {
        return Platform.OS === 'android'
    }

    reset() {
        this.timer && clearTimeout(this.timer)
        this.state.pullPan.stopAnimation();
        this.resetBack();
    }

    resetBack() {
        Animated.sequence([
            Animated.timing(this.state.pullPan, {
                toValue: {x: 0, y: this.topIndicatorHeight * -1},
                easing: Easing.linear,
                duration: this.duration
            }).start(() => {
                this.props.onRefreshEnd && this.props.onRefreshEnd();
                this.setState({
                    status: pull_init,
                    progress: 0,
                })
            })
        ])
    }

    componentWillUnmount() {
        this.timer && clearTimeout(this.timer);
    }

    render() {
        const {status} = this.state;
        return (
            <View style={[styles.wrap, this.props.style]} onLayout={(e) => this.onLayout(e)}>
                <Animated.View
                    style={[this.state.pullPan.getLayout()]}
                >
                    <View>
                        {
                            status !== pull_refresh_ing ?
                                <View
                                    style={[styles.headWrap, {
                                        height: this.topIndicatorHeight,
                                        justifyContent: 'flex-end',
                                        paddingBottom: 5
                                    }]}>
                                    <LottieView
                                        style={{height: 50, width: SCREEN_WIDTH, marginBottom:30}}
                                        source={require('./json/lender4_pull')}
                                        progress={this.state.progress}
                                        loop={false}
                                        enableMergePathsAndroidForKitKatAndAbove
                                    />
                                </View>
                                :
                                <View
                                    style={[styles.headWrap, {
                                        height: this.topIndicatorHeight,
                                        justifyContent: 'flex-end',
                                        paddingBottom: 5
                                    }]}>
                                    <LottieView
                                        ref={(c) => {
                                            this.refreshingLottie = c;
                                        }}
                                        style={{height: 50, width: SCREEN_WIDTH, marginBottom:30}}
                                        source={require('./json/lender4_refresh')}
                                        loop={true}
                                        enableMergePathsAndroidForKitKatAndAbove
                                    />
                                </View>
                        }
                    </View>


                    <View
                        {...this.panResponder.panHandlers}
                        style={{width: this.state.width, height: this.state.height}}
                    >
                        <FlatList
                            style={{flex: 1}}
                            ref={(c) => {
                                this.scroll = c;
                            }}
                            onScroll={e => this.onScroll(e)}
                            data={this.dataList}
                            onEndReachedThreshold={this.isAndroid() ? 0.001 : -0.1}
                            keyExtractor={(item, index) => index}
                            refreshing={false}
                            scrollEnabled={this.state.scrollEnabled}
                            ItemSeparatorComponent={() => {
                                return <View style={{height: 0.5, backgroundColor: '#E5E5E5'}}/>
                            }}
                            renderItem={this.renderItem}
                        />
                    </View>
                </Animated.View>
            </View>
        );
    }

}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        position: 'relative',
        zIndex: -999
    },
    headWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
