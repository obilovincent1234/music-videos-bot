package torrent

import (
	"github.com/obilovincent1234/music-videos-bot/pkg/uri"
)

// SaveTorrentFromLink creates a Torrent from a link
func SaveTorrentFromLink(link string) (*Torrent, error) {
	t, err := newTorrentFromLink(link).create()
	return t, err
}

func newTorrentFromLink(link string) *Torrent {
	t := &Torrent{Magnet: link}
	u := uri.NewURI(link)
	t.Title = u.DisplayName()
	return t
}
