package main

import "net/http"

type TrainImage struct {
	URL                 string `json:"url"`                 // 图片资源地址。
	TriggerX            int    `json:"triggerX"`            // 火车横向到达该位置时显示这张图片。
	FadeDurationMS      int    `json:"fadeDurationMs"`      // 图片浮现动画持续时间。
	Animation           string `json:"animation"`           // 图片出场特效名称。
	Text                string `json:"text"`                // 图片上显示的浮动文字。
	TextStartX          int    `json:"textStartX"`          // 文字从图片右侧开始的横向位置。
	TextEndX            int    `json:"textEndX"`            // 文字从右往左移动到图片左侧的横向位置。
	TextMoveDurationMS  int    `json:"textMoveDurationMs"`  // 文字从右往左移动的持续时间。
	TextFloatArea       string `json:"textFloatArea"`       // 文字移动完成后漂浮的区域，例如 image。
	TextFloatDistance   int    `json:"textFloatDistance"`   // 文字在整张图片范围内漂浮的最大距离。
	TextFloatDurationMS int    `json:"textFloatDurationMs"` // 文字一次漂浮动画持续时间。
	TextOnlyInView      bool   `json:"textOnlyInView"`      // 是否只有图片出现在网页可视区域时才让文字漂浮。
}
type TrainConfig struct { // 定义小火车部分的完整配置。
	Images       []TrainImage `json:"images"`       // 多张图片配置，前端按 TriggerX 依次浮现。
	Speed        int          `json:"speed"`        // 火车从左往右的匀速运动速度。
	FollowFactor float64      `json:"followFactor"` // 火车跟随鼠标移动的灵敏度。
	MouseAxis    string       `json:"mouseAxis"`    // 鼠标跟随方向，例如 x、y、xy。
	Loop         bool         `json:"loop"`         // 是否循环播放图片和文字。
}

var trainConfig = TrainConfig{
	Images: []TrainImage{
		{URL: "/assets/images/train-1.jpg", TriggerX: 120, FadeDurationMS: 800, Animation: "fade-up", Text: "天府成都", TextStartX: 100, TextEndX: -100, TextMoveDurationMS: 1600, TextFloatArea: "image", TextFloatDistance: 10, TextFloatDurationMS: 1800, TextOnlyInView: true},     // 第一张图片配置。
		{URL: "/assets/images/train-2.jpg", TriggerX: 360, FadeDurationMS: 900, Animation: "zoom-in", Text: "山水四川", TextStartX: 120, TextEndX: -120, TextMoveDurationMS: 1800, TextFloatArea: "image", TextFloatDistance: 12, TextFloatDurationMS: 2000, TextOnlyInView: true},     // 第二张图片配置。
		{URL: "/assets/images/train-3.jpg", TriggerX: 620, FadeDurationMS: 1000, Animation: "fade-right", Text: "继续向前", TextStartX: 140, TextEndX: -140, TextMoveDurationMS: 2000, TextFloatArea: "image", TextFloatDistance: 14, TextFloatDurationMS: 2200, TextOnlyInView: true}, // 第三张图片配置。
	},
	Speed:        3,    // 火车每帧匀速向右移动 3 像素。
	FollowFactor: 0.18, // 鼠标移动 1 像素时火车跟随移动 0.18 像素。
	MouseAxis:    "xy", // 火车同时跟随鼠标横向和纵向移动。
	Loop:         true, // 图片和文字播放结束后循环。
}

func handleTrainConfig(w http.ResponseWriter, r *http.Request) { // 处理小火车图片、文字和鼠标跟随配置接口。
	if r.Method != http.MethodGet { // 只允许 GET 请求。
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"}) // 返回 405 错误。
		return                                                                                      // 结束当前请求处理。
	}
	writeJSON(w, http.StatusOK, trainConfig)
}
