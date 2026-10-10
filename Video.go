package main

import "net/http"

type VideoConfig struct {
	URL          string `json:"url"`
	ShrinkWidth  int    `json:"shrinkWidth"`
	ShrinkHeight int    `json:"shrinkHeight"`
	ShrinkTop    int    `json:"shirnkTop"`
	ShrinkLeft   int    `json:"shirnkLeft"`
	DurationMS   int    `json:"durationMs"`
}

var videoConfig = VideoConfig{
	URL:          "/assets/video/intro.mp4", // 前端视频地址，对应 web/assets/video/intro.mp4。
	ShrinkWidth:  260,                       // 缩小后的宽度为 260 像素。
	ShrinkHeight: 146,                       // 缩小后的高度为 146 像素。
	ShrinkTop:    40,                        // 缩小后距离顶部 40 像素。
	ShrinkLeft:   40,                        // 缩小后距离左侧 40 像素。
	DurationMS:   900,                       //缩小动画持续900毫秒
}

func handleVideoConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet { // 只允许 GET 请求。
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"}) // 返回 405 错误。
		return                                                                                      // 结束当前请求处理。
	}
	writeJSON(w, http.StatusOK, videoConfig)
}
