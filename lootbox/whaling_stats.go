package lootbox

import (
	"sort"
	"sync"
)

type WhalingStatsSession struct {
	SessionCounter           uint64                             `json:"session_count"`
	OpenedEach               []uint64                           `json:"opened_count_list"`
	AverageByItem            map[string]*ItemShortQuantityFloat `json:"avg_by_item"`
	AverageByAttribute       map[string]map[string]float64      `json:"avg_by_attribute"`
	ContainterOpened         uint64                             `json:"session_opened"`
	AverageOpened            float64                            `json:"avg_opened"`
	AverageSpent             float64                            `json:"avg_game_money_spent"`
	AverageSpentDollar       float64                            `json:"avg_euro_spent"`
	AverageSpentEuro         float64                            `json:"avg_dollar_spent"`
	AveragePities            float64                            `json:"avg_pities"`
	AverageCollectablesItems float64                            `json:"avg_collectable_items"`
	Percentiles              map[string]uint64                  `json:"percentiles_open"`
	opened                   uint64
	pities                   uint64
	collectablesItems        uint64
	lootBox                  *LootBox
	collectables             []string
}

func (wss *WhalingStatsSession) addAttributeValue(key, value string, quantity float64) {
	if _, ok := wss.AverageByAttribute[key]; !ok {
		wss.AverageByAttribute[key] = make(map[string]float64)
	}
	wss.AverageByAttribute[key][value] += quantity
}

func (wss *WhalingStatsSession) genericStatsWhaling(input *WhalingInput) error {
	outputChannel := make(chan *WhalingSession, StatsWorkerCount)
	input.OutChannel = outputChannel

	var wg sync.WaitGroup
	wg.Add(1)
	// Response handling goroutine
	go func() {
		defer wg.Done()
		for i := 0; i < StatsSessionCount; i++ {
			res := <-outputChannel
			if res == nil {
				// TODO error handling
				continue
			}
			wss.SessionCounter++
			wss.ContainterOpened += res.ContainerOpened

			wss.opened += res.ContainerOpened
			wss.AverageSpent += res.Spent
			wss.AverageSpentEuro += res.SpentEuro
			wss.AverageSpentDollar += res.SpentDollar
			wss.collectablesItems += uint64(len(res.CollectableItems))
			wss.pities += res.Pities
			wss.OpenedEach = append(wss.OpenedEach, res.ContainerOpened)

			// Collectable items are only handled by attributes
			// TODO rework since the info is provided by Whaling Session in ByAttribute
			for _, item := range res.CollectableItems {
				for key, value := range item.Attributes {
					wss.addAttributeValue(key, value, float64(1))
				}
			}
			for _, item := range res.OtherItems {
				if _, ok := wss.AverageByItem[item.ID]; !ok {
					wss.AverageByItem[item.ID] = &ItemShortQuantityFloat{
						Quantity:   0,
						Name:       item.Name,
						ID:         item.ID,
						Attributes: item.Attributes,
					}
				}
				wss.AverageByItem[item.ID].Quantity += float64(item.Quantity)
				for key, value := range item.Attributes {
					wss.addAttributeValue(key, value, float64(item.Quantity))
				}

			}

		}

		close(outputChannel)
		wss.AverageOpened = float64(wss.opened) / float64(wss.SessionCounter)
		wss.AverageSpent /= float64(wss.SessionCounter)
		wss.AverageSpentEuro /= float64(wss.SessionCounter)
		wss.AverageSpentDollar /= float64(wss.SessionCounter)
		wss.AverageCollectablesItems = float64(wss.collectablesItems) / float64(wss.SessionCounter)
		wss.AveragePities = float64(wss.pities) / float64(wss.SessionCounter)
		for _, item := range wss.AverageByItem {
			item.Quantity /= float64(wss.SessionCounter)
		}
		for key, _ := range wss.AverageByAttribute {
			for value, _ := range wss.AverageByAttribute[key] {
				wss.AverageByAttribute[key][value] /= float64(wss.SessionCounter)
			}
		}

		sort.Slice(wss.OpenedEach, func(i, j int) bool { return wss.OpenedEach[i] < wss.OpenedEach[j] })
		// In Quantity mode, this is useless
		if input.SessionType != Quantity {
			wss.Percentiles["best"] = wss.OpenedEach[0]
			wss.Percentiles["10%%"] = wss.OpenedEach[StatsSessionCount/10]
			wss.Percentiles["33%%"] = wss.OpenedEach[StatsSessionCount/3]
			wss.Percentiles["50%%"] = wss.OpenedEach[StatsSessionCount/2]
			wss.Percentiles["66%%"] = wss.OpenedEach[StatsSessionCount*2/3]
			wss.Percentiles["90%%"] = wss.OpenedEach[StatsSessionCount*9/20]
			wss.Percentiles["95%%"] = wss.OpenedEach[StatsSessionCount*19/20]
			wss.Percentiles["worst"] = wss.OpenedEach[StatsSessionCount-1]
		}
	}()

	for i := 0; i < StatsSessionCount; i++ {
		StateWorkerChan <- input
	}
	wg.Wait()

	return nil
}

type sessionType uint64

const (
	Target sessionType = iota
	Quantity
	Stop
)

type WhalingInput struct {
	SessionType    sessionType
	Target         string
	Quantity       int
	WhalingSession *WhalingStatsSession
	OutChannel     chan *WhalingSession
}

func (lb *LootBox) NewWhalingStatsSession(collectables []string) *WhalingStatsSession {
	return &WhalingStatsSession{
		collectables:       collectables,
		lootBox:            lb,
		OpenedEach:         []uint64{},
		Percentiles:        make(map[string]uint64),
		AverageByItem:      make(map[string]*ItemShortQuantityFloat),
		AverageByAttribute: make(map[string]map[string]float64),
	}
}

func (wss *WhalingStatsSession) StatsSimpleWhaling(count int) error {
	input := &WhalingInput{
		SessionType:    Quantity,
		Quantity:       count,
		WhalingSession: wss,
	}
	return wss.genericStatsWhaling(input)
}

func (wss *WhalingStatsSession) StatsTargetWhaling(target string) error {
	input := &WhalingInput{
		SessionType:    Target,
		Target:         target,
		WhalingSession: wss,
	}
	return wss.genericStatsWhaling(input)
}

var (
	StateWorkerChan = make(chan *WhalingInput, StatsWorkerCount)
)

const (
	StatsSessionCount = 1000
	StatsWorkerCount  = 8
)

func worker(id int) {
	for j := range StateWorkerChan {
		if j.SessionType == Stop {
			return
		}
		ws, err := j.WhalingSession.lootBox.NewWhalingSession(j.WhalingSession.collectables)
		if err != nil {
			// TODO proper error handling
			j.OutChannel <- nil
		}
		switch j.SessionType {
		case Target:
			err = ws.TargetWhaling(j.Target)
		case Quantity:
			err = ws.SimpleWhaling(j.Quantity)
		default:
			j.OutChannel <- nil
		}
		if err != nil {
			j.OutChannel <- nil
		}

		j.OutChannel <- ws
	}
}

func InitStatsWorkers() {
	for w := 0; w < StatsWorkerCount; w++ {
		go worker(w)
	}
}

func StopStatsWorkers() {
	close(StateWorkerChan)
}
