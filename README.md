# wakeonlan by bun
## 需求
目前发现 wireguard 的 peer，并不能直接唤醒 access to lan 模式对面局域网下的机器，还没探究原因。
之前的方式是，ssh 到对面 24 小时开机的机器，然后从这个机器再唤醒需要的机器。
## 本项目的作用
直接启动一个很小的服务，放在`需求`里的 24 小时开机的机器，这样需要唤醒机器时候直接在 peer 访问一个 web，点一下就直接唤醒了，如果是在 pc ，这样还是会快很多（作者是有一个常用收藏 nav 页面，直接放上就行了）。

## 额外
小试一下bun的解决问题的能力