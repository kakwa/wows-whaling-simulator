package wows

import (
	"context"
	"errors"
	"github.com/IceflowRE/go-wargaming/v3/wargaming"
	"github.com/IceflowRE/go-wargaming/v3/wargaming/wows"
	"net/http"
	"time"
)

var (
	EURealm   = wargaming.RealmEu
	NARealm   = wargaming.RealmNa
	AsiaRealm = wargaming.RealmAsia
)

var (
	ErrShipReturnInvalid = errors.New("Invalid return size for ship listing")
	ErrUnknownRealm      = errors.New("Unknown Wows realm/server")
)

func WowsRealm(realmStr string) (wargaming.Realm, error) {
	switch realmStr {
	case "eu":
		return EURealm, nil
	case "na":
		return NARealm, nil
	case "asia":
		return AsiaRealm, nil
	default:
		return nil, ErrUnknownRealm
	}
}

type WowsAPI struct {
	client      *wargaming.Client
	ShipMapping map[int]string
}

func NewWowsAPI(key string) *WowsAPI {
	return &WowsAPI{
		client:      wargaming.NewClient(key, &wargaming.ClientOptions{HTTPClient: &http.Client{Timeout: 10 * time.Second}}),
		ShipMapping: make(map[int]string),
	}
}

func (wowsAPI *WowsAPI) FillShipMapping() error {
	client := wowsAPI.client
	respSize := 9999
	pageNo := 1
	for respSize != 0 {
		// TODO rework to actually do something with the tier
		res, err := client.Wows.EncyclopediaShips(context.Background(), wargaming.RealmEu, &wows.EncyclopediaShipsOptions{
			Fields: []string{"name", "ship_id", "tier"},
			PageNo: &pageNo,
		})
		if err != nil && pageNo == 1 {
			return err
		}
		if err != nil {
			// FIXME the go-wargaming library doesn't provide the "meta" part of the response
			// (containing the number of pages and number of ships)
			// so for now, we stop on the first error which is not ideal...
			return nil
		}
		respSize = len(res)
		pageNo++
		for _, ship := range res {
			wowsAPI.ShipMapping[*ship.ShipId] = *ship.Name
		}
	}
	return nil

}

func (wowsAPI *WowsAPI) SearchPlayer(realm wargaming.Realm, nick string, mode string) ([]*wows.AccountList, error) {
	client := wowsAPI.client
	limit := 5
	res, err := client.Wows.AccountList(context.Background(), realm, nick, &wows.AccountListOptions{
		Fields: []string{"account_id", "nickname"},
		Type:   wargaming.String(mode),
		Limit:  &limit,
	})
	if err != nil {
		return nil, err
	}
	return res, nil

}

func (wowsAPI *WowsAPI) GetPlayerShips(realm wargaming.Realm, playerId int) ([]string, error) {
	client := wowsAPI.client
	var ret []string
	inGarage := "1"
	res, err := client.Wows.ShipsStats(context.Background(), realm, playerId, &wows.ShipsStatsOptions{
		Fields:   []string{"ship_id"},
		InGarage: &inGarage,
	})
	if err != nil {
		return nil, err
	}

	if len(res) != 1 {
		return nil, ErrShipReturnInvalid
	}
	shipList, ok := res[playerId]
	if !ok {
		return nil, ErrShipReturnInvalid
	}
	for _, ship := range shipList {
		shipName, ok := wowsAPI.ShipMapping[*ship.ShipId]
		if !ok {
			continue
		}
		ret = append(ret, shipName)
	}
	return ret, nil
}
