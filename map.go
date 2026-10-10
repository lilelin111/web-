package main

import (
	"net/http"
	"strings"
)

// 地点
type point struct {
	PointName        string `json:"PointName"`
	PointEnglishName string `json:"PointEnglishName"`
	URL              string `json:"URL"`
}

var points = []point{}

func FindPointName(pointname string) (string, bool) {
	for _, point1 := range points {
		if point1.PointName == pointname {
			return "此点位存在", true
		}
	}
	return "此点位不存在", false
}

// 2. HTTP 接口处理函数（结合了底层函数，并修复了之前的 GET 请求 Bug）
func handlerLocations(w http.ResponseWriter, r *http.Request) {
	// 只允许 GET 请求
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method Not Allowed"})
		return
	}

	// 获取 URL 中传递的查询参数，例如 ?name=PointA
	pointName := r.URL.Query().Get("name")

	// 结合点：在 Handler 中调用底层的 FindPointName 函数
	if pointName != "" {
		found, err := FindPointName(pointName)
		if err {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"exists":  true,
				"message": found + pointName + " 存在",
			})
		} else {
			writeJSON(w, http.StatusNotFound, map[string]interface{}{
				"exists":  false,
				"message": found + pointName,
			})
		}
		return
	}
	writeJSON(w, http.StatusOK, points)
}
func handleJump(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method Not Allowed"})
		return
	}
	slug := strings.TrimPrefix(r.URL.Path, "jump")
	point, err := FindPointName(slug)
	if !err {
		http.NotFound(w, r)
		return
	}
	points := findPoint(point)
	http.Redirect(w, r, points.URL, http.StatusFound)
}
func findPoint(name string) point {
	if name == "" {
		return point{}
	}
	for _, point1 := range points {
		if point1.PointName == name {
			return point1
		}
	}
	return point{}
}
