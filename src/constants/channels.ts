import type { MediaChannel } from '../types';

export const MEDIA_CHANNELS: MediaChannel[] = [
  // === Video ===
  {
    id: 'linear-tv',
    name: 'Local Linear TV',
    category: 'video',
    objectiveKPI: 'Awareness-CPM',
    audienceUniverse: 3_643_402,
    tactics: [
      { id: 'linear-tv-spot', name: 'TV Spot', adUnits: [':15s', ':30s', ':60s'], buyType: 'trp', platformCPM: 35 },
    ],
  },
  {
    id: 'ctv',
    name: 'CTV (Hallux)',
    category: 'video',
    objectiveKPI: 'Awareness-CPM',
    tactics: [
      { id: 'ctv-preroll', name: 'CTV Pre-Roll', adUnits: [':15s', ':30s'], buyType: 'cpm', platformCPM: 38 },
    ],
  },
  {
    id: 'olv',
    name: 'OLV (Hallux)',
    category: 'video',
    objectiveKPI: 'Engagement-VCR',
    tactics: [
      { id: 'olv-preroll', name: 'OLV Pre-Roll', adUnits: [':15s', ':30s'], buyType: 'cpm', platformCPM: 15 },
    ],
  },
  {
    id: 'youtube-reservation',
    name: 'YouTube Reservation',
    category: 'video',
    objectiveKPI: 'Engagement-VCR',
    tactics: [
      { id: 'yt-res-trueview', name: 'TrueView', adUnits: [':15s', ':30s'], buyType: 'cpv' },
    ],
  },
  {
    id: 'youtube-auction',
    name: 'YouTube Auction',
    category: 'video',
    objectiveKPI: 'Engagement-VCR',
    tactics: [
      { id: 'yt-auc-instream', name: 'In-Stream', adUnits: [':15s', ':30s'], buyType: 'cpv' },
    ],
  },

  // === Digital ===
  {
    id: 'display-premium',
    name: 'Display (Premium)',
    category: 'digital',
    objectiveKPI: 'Awareness-CPM',
    tactics: [
      { id: 'display-prem-standard', name: 'Standard Display', adUnits: ['300x250', '728x90', '160x600'], buyType: 'cpm', platformCPM: 5 },
    ],
  },
  {
    id: 'display-standard',
    name: 'Display (Standard)',
    category: 'digital',
    objectiveKPI: 'Awareness-CPM',
    tactics: [
      { id: 'display-std-programmatic', name: 'Programmatic Display', adUnits: ['300x250', '728x90'], buyType: 'cpm', platformCPM: 3 },
    ],
  },
  {
    id: 'native-premium',
    name: 'Native (Premium)',
    category: 'digital',
    objectiveKPI: 'Traffic-CP Site Visit',
    tactics: [
      { id: 'native-prem-content', name: 'Sponsored Content', adUnits: ['In-Feed'], buyType: 'cpc', platformCPM: 8 },
    ],
  },
  {
    id: 'native-standard',
    name: 'Native (Standard)',
    category: 'digital',
    objectiveKPI: 'Traffic-CP Site Visit',
    tactics: [
      { id: 'native-std-content', name: 'Native Content', adUnits: ['In-Feed'], buyType: 'cpc', platformCPM: 6 },
    ],
  },

  // === Social ===
  {
    id: 'meta-reach',
    name: 'Meta Reach',
    category: 'social',
    objectiveKPI: 'Awareness-CPM',
    tactics: [
      { id: 'meta-reach-feed', name: 'Feed', adUnits: ['Single Image', 'Carousel', 'Video'], buyType: 'cpm', platformCPM: 3 },
    ],
  },
  {
    id: 'meta-video',
    name: 'Meta Video Views',
    category: 'social',
    objectiveKPI: 'Engagement-CP Thru-Play',
    tactics: [
      { id: 'meta-video-feed', name: 'Video Feed', adUnits: ['Video', 'Reels'], buyType: 'cpv', platformCPM: 5 },
    ],
  },
  {
    id: 'meta-traffic',
    name: 'Meta Traffic',
    category: 'social',
    objectiveKPI: 'Traffic-CPC',
    tactics: [
      { id: 'meta-traffic-feed', name: 'Traffic Feed', adUnits: ['Single Image', 'Carousel'], buyType: 'cpc', platformCPM: 7 },
    ],
  },
];

export function getChannelById(id: string): MediaChannel | undefined {
  return MEDIA_CHANNELS.find((ch) => ch.id === id);
}

export function getChannelsByCategory(category: MediaChannel['category']): MediaChannel[] {
  return MEDIA_CHANNELS.filter((ch) => ch.category === category);
}
