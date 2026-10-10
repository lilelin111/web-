package main

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"time"
)

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status) //写入状态码
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Println("write json failed:%v", err)
	}
}
func main() {
	weDir := filepath.Join(".", "web")                 //前端目录
	assetDir := filepath.Join(weDir, "assets")         //定义静态资源目录
	mux := http.NewServeMux()                          //创建路由
	assetServer := http.FileServer(http.Dir(assetDir)) //创建服务器
	mux.Handle("/assets/", http.StripPrefix("/assets/", assetServer))
	mux.HandleFunc("/api/vodeo-config", handleVideoConfig) //视频缩小
	mux.HandleFunc("/api/locations", handlerLocations)     //注册地图地点列表接口
	mux.HandleFunc("/jump/", handleJump)                   //跳转网页
	mux.HandleFunc("/api/train-config", handleTrainConfig) //小火车
	mux.HandleFunc("/api/page-data", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet { // 只允许 GET 请求。
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"}) // 返回 405 错误。
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"video": videoConfig,
			"map":   points,
			"train": trainConfig,
		})
	})
	mux.HandleFunc(" /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(weDir, "index.html"))
	})
	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      0,
		IdleTimeout:       60 * time.Second,
	}
	log.Println("server started:http://localhost:8080")
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
