'use client'

import dynamic from 'next/dynamic'
import { useGeoStore } from '@/store/useGeoStore'
import EventFeed from '@/components/events/EventFeed'
import EventPanel from '@/components/events/EventPanel'
import type { EventWithAnalysis } from '@/lib/supabase'

const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), { ssr: false })

// ---------------------------------------------------------------------------
// Dummy data — replace with getEvents() once Supabase is wired
// ---------------------------------------------------------------------------
const DUMMY_EVENTS: EventWithAnalysis[] = [
  {
    id: '1',
    gdelt_id: 'gdelt-001',
    title: 'Russia Launches Coordinated Missile Strikes on Ukrainian Energy Grid',
    description:
      'Russian forces executed a large-scale coordinated attack targeting transformer stations and power distribution nodes across central and western Ukraine. Over 60 missile and Shahed drone strikes were reported within a 4-hour window, causing widespread blackouts affecting an estimated 8 million civilians ahead of winter.',
    lat: 50.45,
    lng: 30.52,
    country: 'Ukraine',
    region: 'Eastern Europe',
    event_type: 'MILITARY_STRIKE',
    source_url: null,
    occurred_at: '2026-06-05T16:15:00Z',
    ingested_at: '2026-06-05T16:45:00Z',
    event_analyses: [
      {
        id: 'a1',
        event_id: '1',
        summary:
          'Sustained infrastructure targeting signals a deliberate escalation toward a winter attrition strategy. Energy commodity prices and defense sector equities are the primary market vectors. European natural gas futures likely to gap higher at open given supply re-routing pressure.',
        risk_level: 'high',
        affected_tickers: [
          {
            symbol: 'XOM',
            name: 'ExxonMobil Corp',
            expected_direction: 'up',
            rationale:
              'European energy diversification demand increases LNG spot prices, benefiting US exporters with existing infrastructure.',
            confidence: 0.82,
          },
          {
            symbol: 'RTX',
            name: 'RTX Corporation',
            expected_direction: 'up',
            rationale:
              'Patriot missile and air-defense system replenishment orders expected to accelerate from NATO member states.',
            confidence: 0.79,
          },
          {
            symbol: 'LMT',
            name: 'Lockheed Martin',
            expected_direction: 'up',
            rationale:
              'HIMARS resupply and ATACMS production ramp-up likely given battlefield consumption rates.',
            confidence: 0.74,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-05T16:47:00Z',
      },
    ],
  },
  {
    id: '2',
    gdelt_id: 'gdelt-002',
    title: 'Iran Revolutionary Guard Threatens Strait of Hormuz Closure in Response to Sanctions',
    description:
      'Senior IRGC commanders issued an official statement threatening to seal the Strait of Hormuz following new US Treasury designations targeting Iranian petrochemical exports. The statement cited "all necessary measures" and was accompanied by naval exercise announcements in the Persian Gulf.',
    lat: 26.6,
    lng: 56.25,
    country: 'Iran',
    region: 'Middle East',
    event_type: 'GEOPOLITICAL_THREAT',
    source_url: null,
    occurred_at: '2026-06-05T14:00:00Z',
    ingested_at: '2026-06-05T14:22:00Z',
    event_analyses: [
      {
        id: 'a2',
        event_id: '2',
        summary:
          'Even a partial Hormuz disruption would remove ~21% of global seaborne oil transit. Crude futures pricing reflects a risk premium spike. Insurance and tanker rates will climb sharply. Regional military posturing historically resolves without full closure, but the tail risk is significant given current diplomatic breakdown.',
        risk_level: 'critical',
        affected_tickers: [
          {
            symbol: 'XOM',
            name: 'ExxonMobil Corp',
            expected_direction: 'up',
            rationale:
              'Supply shock scenario pushes Brent crude above $130/bbl, directly expanding upstream margins.',
            confidence: 0.88,
          },
          {
            symbol: 'CVX',
            name: 'Chevron Corp',
            expected_direction: 'up',
            rationale:
              'Upstream production in non-Gulf regions gains pricing leverage; existing US Gulf production unaffected.',
            confidence: 0.85,
          },
          {
            symbol: 'AAL',
            name: 'American Airlines',
            expected_direction: 'down',
            rationale:
              'Jet fuel comprises ~25% of operating costs; a $30/bbl spike erodes 2026 EPS estimates by ~35%.',
            confidence: 0.81,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-05T14:24:00Z',
      },
    ],
  },
  {
    id: '3',
    gdelt_id: 'gdelt-003',
    title: "PLA Navy Conducts Live-Fire Exercises Encircling Taiwan's Northern Coastline",
    description:
      "China's People's Liberation Army Navy launched its largest unannounced military exercise in the Taiwan Strait since 2023, deploying 48 warships and conducting simulated blockade maneuvers within Taiwan's declared ADIZ. Taiwan's defense ministry placed armed forces on heightened alert.",
    lat: 25.04,
    lng: 121.56,
    country: 'Taiwan',
    region: 'East Asia',
    event_type: 'MILITARY_EXERCISE',
    source_url: null,
    occurred_at: '2026-06-05T11:30:00Z',
    ingested_at: '2026-06-05T11:58:00Z',
    event_analyses: [
      {
        id: 'a3',
        event_id: '3',
        summary:
          'Taiwan produces ~92% of the world\'s leading-edge semiconductors below 5nm. Even a 30-day supply chain disruption would create a deficit that US and European fabs cannot compensate for within 18 months. Markets are pricing blockade risk into semiconductor names with Taiwan supply chain exposure.',
        risk_level: 'critical',
        affected_tickers: [
          {
            symbol: 'NVDA',
            name: 'NVIDIA Corp',
            expected_direction: 'down',
            rationale:
              'TSMC manufactures 100% of NVIDIA H100/H200 GPUs; any blockade disrupts the AI accelerator supply chain critically.',
            confidence: 0.91,
          },
          {
            symbol: 'TSM',
            name: 'Taiwan Semiconductor',
            expected_direction: 'down',
            rationale:
              'Direct operational and geopolitical risk to primary production facilities in Hsinchu and Tainan.',
            confidence: 0.94,
          },
          {
            symbol: 'AMAT',
            name: 'Applied Materials',
            expected_direction: 'down',
            rationale:
              'Capital equipment order flow from TSMC represents ~18% of AMAT annual revenue; blockade halts installations.',
            confidence: 0.77,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-05T12:01:00Z',
      },
    ],
  },
  {
    id: '4',
    gdelt_id: 'gdelt-004',
    title: 'Federal Reserve Signals Emergency Inter-Meeting Rate Decision Amid Inflation Surge',
    description:
      'Multiple Federal Reserve governors made public remarks suggesting the FOMC is considering an emergency inter-meeting 50bps rate hike following CPI data showing a surprise 0.8% monthly increase. Fed Chair press statement described the data as "inconsistent with our price stability mandate."',
    lat: 38.89,
    lng: -77.05,
    country: 'United States',
    region: 'North America',
    event_type: 'MONETARY_POLICY',
    source_url: null,
    occurred_at: '2026-06-05T09:00:00Z',
    ingested_at: '2026-06-05T09:18:00Z',
    event_analyses: [
      {
        id: 'a4',
        event_id: '4',
        summary:
          'An inter-meeting hike would be the first since COVID-era emergency actions. The signal alone reprices the entire yield curve within hours. Growth equities de-rate sharply as the discount rate resets; defensive sectors and hard assets outperform in the near term.',
        risk_level: 'medium',
        affected_tickers: [
          {
            symbol: 'TLT',
            name: 'iShares 20+ Year Treasury',
            expected_direction: 'down',
            rationale:
              'Long-duration bonds reprice immediately on rate hike expectations; 20yr yield could jump 40–60bps intraday.',
            confidence: 0.87,
          },
          {
            symbol: 'GLD',
            name: 'SPDR Gold Trust',
            expected_direction: 'up',
            rationale:
              'Stagflation narrative strengthens gold as an inflation hedge despite real rate headwinds.',
            confidence: 0.71,
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corp',
            expected_direction: 'down',
            rationale:
              'High-duration growth names re-rate as the risk-free rate increases; DCF models compress meaningfully.',
            confidence: 0.78,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-05T09:20:00Z',
      },
    ],
  },
  {
    id: '5',
    gdelt_id: 'gdelt-005',
    title: 'North Korea Conducts ICBM Test Capable of Reaching US Mainland',
    description:
      'North Korea launched what South Korean and US intelligence assessed as a Hwasong-18 solid-fuel ICBM on a lofted trajectory reaching an altitude of 6,500km before splashing down in Japanese waters. Japan issued a national missile alert. UN Security Council emergency session convened.',
    lat: 39.03,
    lng: 125.75,
    country: 'North Korea',
    region: 'East Asia',
    event_type: 'MISSILE_TEST',
    source_url: null,
    occurred_at: '2026-06-05T05:20:00Z',
    ingested_at: '2026-06-05T05:47:00Z',
    event_analyses: [
      {
        id: 'a5',
        event_id: '5',
        summary:
          'The Hwasong-18 solid-fuel capability eliminates launch preparation windows for preemptive strike doctrine. This materially increases the perceived nuclear threat and accelerates DoD budget line items for missile defense. South Korean equities will gap lower at open given proximity risk.',
        risk_level: 'high',
        affected_tickers: [
          {
            symbol: 'RTX',
            name: 'RTX Corporation',
            expected_direction: 'up',
            rationale:
              'Patriot and THAAD anti-ballistic missile system demand spikes; Japan and South Korea likely to accelerate procurement.',
            confidence: 0.83,
          },
          {
            symbol: 'LMT',
            name: 'Lockheed Martin',
            expected_direction: 'up',
            rationale:
              'THAAD Terminal High Altitude Area Defense system is an LMT product; regional deployments expected to increase.',
            confidence: 0.80,
          },
          {
            symbol: 'BA',
            name: 'Boeing',
            expected_direction: 'up',
            rationale:
              'Ground-based Midcourse Defense (GMD) system integration and F-35 sales pipeline strengthens for regional allies.',
            confidence: 0.68,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-05T05:49:00Z',
      },
    ],
  },
  {
    id: '6',
    gdelt_id: 'gdelt-006',
    title: 'OPEC+ Announces Surprise 1.5 Million BPD Output Reduction Effective Immediately',
    description:
      'OPEC+ ministers convened an emergency video conference and agreed to an immediate production reduction of 1.5 million barrels per day, citing "necessary market rebalancing." Saudi Arabia and Russia confirmed equal contribution to the cut. The announcement came outside the regular meeting cycle.',
    lat: 24.68,
    lng: 46.72,
    country: 'Saudi Arabia',
    region: 'Middle East',
    event_type: 'COMMODITY_POLICY',
    source_url: null,
    occurred_at: '2026-06-04T18:00:00Z',
    ingested_at: '2026-06-04T18:25:00Z',
    event_analyses: [
      {
        id: 'a6',
        event_id: '6',
        summary:
          'Unscheduled cuts signal OPEC+ determination to hold Brent above $85/bbl floor. Supply-side shock reprices energy equities upward while hitting consumer-facing sectors. The surprise nature of the announcement suggests cartel unity is stronger than markets priced.',
        risk_level: 'medium',
        affected_tickers: [
          {
            symbol: 'XOM',
            name: 'ExxonMobil Corp',
            expected_direction: 'up',
            rationale:
              'Higher Brent benchmark directly expands upstream realized pricing; US shale breakeven economics improve.',
            confidence: 0.86,
          },
          {
            symbol: 'CVX',
            name: 'Chevron Corp',
            expected_direction: 'up',
            rationale:
              'Integrated oil majors benefit from improved global crude pricing across all upstream segments.',
            confidence: 0.84,
          },
          {
            symbol: 'AAL',
            name: 'American Airlines',
            expected_direction: 'down',
            rationale:
              'Fuel surcharge lag creates a 6–8 week window of margin compression before hedges reset.',
            confidence: 0.76,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-04T18:27:00Z',
      },
    ],
  },
  {
    id: '7',
    gdelt_id: 'gdelt-007',
    title: 'Germany Declares National Energy Emergency, Activates Gas Rationing Protocol',
    description:
      'The German federal government invoked the third and final stage of the Emergency Gas Plan, triggering mandatory consumption cuts of up to 20% for industrial users. The Bundesnetzagentur cited depleted strategic reserves following an unseasonably cold spring and reduced Norwegian pipeline flows.',
    lat: 52.52,
    lng: 13.40,
    country: 'Germany',
    region: 'Western Europe',
    event_type: 'ENERGY_CRISIS',
    source_url: null,
    occurred_at: '2026-06-04T09:30:00Z',
    ingested_at: '2026-06-04T09:52:00Z',
    event_analyses: [
      {
        id: 'a7',
        event_id: '7',
        summary:
          'German industrial output contraction is directly bearish for European manufacturing equities. BASF and auto sector most exposed given energy-intensive production. LNG spot demand surge from Germany benefits US exporters. Euro likely to weaken against USD on deteriorating economic outlook.',
        risk_level: 'medium',
        affected_tickers: [
          {
            symbol: 'BP',
            name: 'BP plc',
            expected_direction: 'up',
            rationale:
              'BP\'s LNG trading division captures margin on spot price premium as Germany emergency-procures cargoes.',
            confidence: 0.74,
          },
          {
            symbol: 'SHEL',
            name: 'Shell plc',
            expected_direction: 'up',
            rationale:
              'European gas grid tightness benefits Shell\'s integrated gas division; TTF contract pricing surges.',
            confidence: 0.72,
          },
          {
            symbol: 'STLA',
            name: 'Stellantis NV',
            expected_direction: 'down',
            rationale:
              'German plant closures and energy rationing directly impact production schedules across European manufacturing lines.',
            confidence: 0.69,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-04T09:55:00Z',
      },
    ],
  },
  {
    id: '8',
    gdelt_id: 'gdelt-008',
    title: 'Armed Clashes Erupt Along Line of Control in Kashmir, Artillery Exchanges Reported',
    description:
      'Indian Army and Pakistani military forces exchanged artillery fire across the Line of Control in the Poonch-Rajouri sector for the third consecutive day. India reported 4 casualties; Pakistan claims 6 Indian soldiers killed. Both governments recalled their high commissioners.',
    lat: 33.77,
    lng: 73.77,
    country: 'India',
    region: 'South Asia',
    event_type: 'BORDER_CONFLICT',
    source_url: null,
    occurred_at: '2026-06-03T14:00:00Z',
    ingested_at: '2026-06-03T14:35:00Z',
    event_analyses: [
      {
        id: 'a8',
        event_id: '8',
        summary:
          'Sustained cross-LoC exchanges at this intensity are unusual in the post-2021 ceasefire context. Both nations hold nuclear deterrence posture, limiting escalation ceiling but creating acute near-term market risk for Indian IT and financial sectors as foreign institutional investor sentiment deteriorates.',
        risk_level: 'high',
        affected_tickers: [
          {
            symbol: 'INFY',
            name: 'Infosys Ltd',
            expected_direction: 'down',
            rationale:
              'Indian ADRs subject to rapid FII outflows during geopolitical escalation; Infosys trades at premium that compresses under risk-off.',
            confidence: 0.73,
          },
          {
            symbol: 'WIT',
            name: 'Wipro Ltd',
            expected_direction: 'down',
            rationale:
              'Broad IT sector selloff expected on Indian market circuit breaker risk and rupee depreciation pressure.',
            confidence: 0.70,
          },
          {
            symbol: 'HDB',
            name: 'HDFC Bank',
            expected_direction: 'down',
            rationale:
              'Financial sector most sensitive to capital flight; HDFC ADR premium collapses under sustained military escalation.',
            confidence: 0.68,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-03T14:37:00Z',
      },
    ],
  },
  {
    id: '9',
    gdelt_id: 'gdelt-009',
    title: 'Brazil Announces Emergency Moratorium on Soy and Corn Exports Amid Domestic Food Inflation',
    description:
      'Brazil\'s Ministry of Agriculture declared a 90-day export moratorium on soy, corn, and sugar citing domestic food security concerns following a severe drought in Mato Grosso do Sul. The ban affects approximately 12% of global soy trade volume and comes during peak international procurement season.',
    lat: -15.77,
    lng: -47.93,
    country: 'Brazil',
    region: 'South America',
    event_type: 'TRADE_POLICY',
    source_url: null,
    occurred_at: '2026-06-02T20:00:00Z',
    ingested_at: '2026-06-02T20:18:00Z',
    event_analyses: [
      {
        id: 'a9',
        event_id: '9',
        summary:
          'Brazil accounts for ~45% of global soy exports. A 90-day ban creates an immediate supply deficit that redirects procurement to US and Argentine origin, lifting Chicago Board of Trade futures. Grain trading houses with diversified origin portfolios are net beneficiaries.',
        risk_level: 'low',
        affected_tickers: [
          {
            symbol: 'ADM',
            name: 'Archer-Daniels-Midland',
            expected_direction: 'up',
            rationale:
              'ADM\'s US and Argentine origination network captures diverted demand volume at a meaningful margin premium.',
            confidence: 0.80,
          },
          {
            symbol: 'BG',
            name: 'Bunge Global SA',
            expected_direction: 'up',
            rationale:
              'Bunge\'s Argentine operations positioned as primary alternative origin; processing utilization rates improve.',
            confidence: 0.77,
          },
          {
            symbol: 'VALE',
            name: 'Vale SA',
            expected_direction: 'down',
            rationale:
              'BRL likely to depreciate on export restriction signal; Vale\'s USD-denominated revenue versus BRL costs creates negative translation effect.',
            confidence: 0.62,
          },
        ],
        model_version: 'claude-opus-4-8',
        created_at: '2026-06-02T20:20:00Z',
      },
    ],
  },
]

export default function Page() {
  const { selectedEvent, setSelectedEvent, clearSelectedEvent } = useGeoStore()

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#030712]">
      {/* Globe — full screen, z-0 */}
      <GlobeView
        events={DUMMY_EVENTS}
        selectedEvent={selectedEvent}
        onEventSelect={setSelectedEvent}
      />

      {/* Left sidebar — event feed */}
      <EventFeed
        events={DUMMY_EVENTS}
        selectedEvent={selectedEvent}
        onEventSelect={setSelectedEvent}
      />

      {/* Right panel — slides in on selection */}
      {selectedEvent && (
        <EventPanel event={selectedEvent} onClose={clearSelectedEvent} />
      )}
    </div>
  )
}
