# songs 文件夹

此文件夹用于存放本地音乐文件，支持以下格式：
- `.mp3`
- `.m4a`
- `.ogg`
- `.wav`
- `.flac`

## 使用方式

### 方式 1：使用 Meting API（默认）
页面默认使用 Meting API 获取歌单数据并在线播放，无需在此文件夹存放文件。
API 歌曲会自动加载专辑封面、歌词等信息。

### 方式 2：本地歌曲
如果你的歌曲文件没有在线 URL，可以将文件放入此文件夹，然后：
1. 在 `main.html` 中修改 `MUSIC_CONFIG`，改用自定义歌单数据
2. 歌曲的 `url` 字段指向 `songs/你的文件名.mp3`

## 配置说明
在 `main.html` 中找到以下配置：
```js
var MUSIC_CONFIG = {
  server: 'netease',     // 网易云音乐
  type: 'playlist',      // 歌单
  id: '2028178887'       // 歌单 ID
};
```

修改 `id` 即可切换不同歌单。歌单 ID 可从网易云音乐网页版 URL 获取：
`https://music.163.com/#/playlist?id=歌单ID`
