package torrent

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	apiBaseURL = "https://1337x.to/api" // Base URL for 1337x API
	sort       = "seeders"              // Sort order (seeders, leechers, last)
	limit       = 25                    // Limit of results
)

var (
	err1337x      = errors.New("We encountered an error while finding magnet links, please try again")
	errNoTorrents = errors.New("We have no magnet links for this movie now, please come back later")
)

// Search takes keyword to search torrents
func Search(keyword string, limit int) (*[]Torrent, error) {
	keywords := strings.Split(keyword, " ")

	torrentResults, err := searchByKeyword(keywords[0], keywords[1])
	if err != nil {
		return nil, err1337x
	}

	if len(torrentResults) == 0 {
		return nil, errNoTorrents
	}

	torrents, err := newTorrentsBySearch(&torrentResults, limit)
	if err != nil {
		return nil, err
	}

	return torrents, nil
}

func searchByKeyword(service string, id string) ([]TorrentResult, error) {
	url := fmt.Sprintf("%s/search/%s/%s", apiBaseURL, service, id)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error: received status code %d", resp.StatusCode)
	}

	var results struct {
		Torrents []TorrentResult `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return nil, err
	}

	return results.Torrents, nil
}

func newTorrentsBySearch(trs *[]TorrentResult, limit int) (*[]Torrent, error) {
	torrents := []Torrent{}
	for i, tr := range *trs {
		if i == limit {
			break
		}
		t, err := saveTorrentFrom1337x(tr)
		if err != nil {
			continue
		}
		torrents = append(torrents, *t)
	}
	return &torrents, nil
}

func saveTorrentFrom1337x(tr TorrentResult) (*Torrent, error) {
	t := &Torrent{TorrentResult: tr}
	if tr.Title == "" {
		return t, errors.New("Torrent title should not be empty")
	}

	// Assuming `PubDate` is in a valid format or remove if not applicable
	pubDate, err := time.Parse("2006-01-02 15:04:05 +0000", t.PubDate)
	if err != nil {
		return t, err
	}
	t.Title = tr.Title
	t.Magnet = tr.Download
	t.PubStamp = pubDate.Unix()

	return t.create()
}
