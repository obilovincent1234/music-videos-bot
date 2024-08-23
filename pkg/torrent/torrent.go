package torrent

import (
	"fmt"
	"time"

	"github.com/obilovincent1234/music-videos-bot/pkg/db"
)

// Torrent (magnet links)
type Torrent struct {
	ID                  int
	Title               string
	Magnet              string
	PubStamp            int64
	DownloadedAt        time.Time `sql:"-"`
	TorrentResult       `sql:"-"`
}

type TorrentResult struct {
	Title     string `json:"title"`
	Magnet    string `json:"magnet"`
	PubDate   string `json:"pub_date"` // Ensure this field matches your API response
	// Add other fields as needed
}

func (t *Torrent) create() (*Torrent, error) {
	_, err := db.DB.Model(t).
		Where("pub_stamp = ?pub_stamp").
		OnConflict("DO NOTHING").
		SelectOrInsert()
	return t, err
}

// GetByPubStamp find Torrent by PubStamp
func (t *Torrent) GetByPubStamp() (*Torrent, error) {
	err := db.DB.Model(t).Where("pub_stamp = ?", t.PubStamp).Select()
	return t, err
}

// HumanizeSize returns Torrent.Size in human friendly unit
func (t *Torrent) HumanizeSize() string {
	return humanizeSize(t.Size)
}

func humanizeSize(s uint64) string {
	size := float64(s)
	switch {
	case size < 1024:
		return fmt.Sprintf("%d", uint64(size))
	case size < 1024*1024:
		return fmt.Sprintf("%.1fK", size/1024)
	case size < 1024*1024*1024:
		return fmt.Sprintf("%.1fM", size/1024/1024)
	default:
		return fmt.Sprintf("%.1fG", size/1024/1024/1024)
	}
}
