package main

import (
	"log"

	"github.com/obilovincent1234/music-videos-bot/pkg/bot"
	"github.com/obilovincent1234/music-videos-bot/pkg/db"
	"github.com/obilovincent1234/music-videos-bot/pkg/http"
	"github.com/obilovincent1234/music-videos-bot/pkg/model"
	"github.com/obilovincent1234/music-videos-bot/pkg/movie"
	"github.com/obilovincent1234/music-videos-bot/pkg/torrent"
)

func main() {

	db.Init()
	log.Printf("db inited")

	err := model.CreateSchema(db.DB)
	if err != nil {
		log.Printf("error while creating schema: %s", err)
	}

	movie.InitTMDb()
	log.Printf("tmdb inited")

	torrent.InitRARBG()
	log.Printf("rarbg inited")

	go bot.Run()
	log.Printf("bot started")

	go http.RunServer()
	log.Printf("http server started")

	select {}
}
