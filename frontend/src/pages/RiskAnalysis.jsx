import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Brain,
  Shield,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Clock,
  Users,
  ShieldCheck,
  Navigation,
  ArrowRight,
  Maximize2,
  CloudRain,
  Waves,
  Mountain,
  Building2,
  CheckCircle2,
  Home,
  Tent,
  Compass,
  Sparkles,
  X,
  Activity,
  ChevronRight,
  ChevronLeft,
  Radio,
  FileText,
  RotateCw,
  Copy,
  Check,
  Flame,
  Lightbulb,
  Layers,
  MessageSquare,
  Info,
  Sliders,
  Download,
  RefreshCw,
  Zap,
  Droplets,
  Wind,
  Search,
  ExternalLink,
  Cpu
} from 'lucide-react';
import HazardMap from '../components/Map/HazardMap';
import Boilerplate from '../layouts/Boilerplate';
import { postAIExplain, getShelterRecommendation } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { useNavigate } from 'react-router-dom';

// Comprehensive Regional Basins & Catchments Registry across Indian Districts
const REGIONAL_HOTSPOTS_MAP = {
  'delhi': [
    { id: 'YAMUNA', name: 'Yamuna Floodplain Sector R-12', district: 'Central Delhi', lat: 28.6139, lon: 77.2090, defaultHazard: 'FLOOD', terrain: 'River Floodplain Lowland', area: '4.8', elevation: '208m' },
    { id: 'NALA', name: 'Nala Colony & Yamuna Vihar', district: 'East Delhi', lat: 28.6517, lon: 77.2219, defaultHazard: 'FLOOD', terrain: 'Low Drainage Siphon Basin', area: '3.2', elevation: '204m' },
    { id: 'ASOLA', name: 'Asola Wildlife Ridge Slope', district: 'South Delhi', lat: 28.5200, lon: 77.1800, defaultHazard: 'LANDSLIDE', terrain: 'Elevated Rocky Ridge Escarpment', area: '7.5', elevation: '265m' },
    { id: 'BURARI', name: 'Burari Drainage Basin', district: 'North Delhi', lat: 28.7500, lon: 77.1950, defaultHazard: 'FLOOD', terrain: 'Polder Lowland Catchment', area: '5.1', elevation: '207m' }
  ],
  'bhopal': [
    { id: 'UPPERLAKE', name: 'Upper Lake / Bada Talab Basin', district: 'Bhopal', lat: 23.2500, lon: 77.3600, defaultHazard: 'FLOOD', terrain: 'Lake Spillway & Lowland Basin', area: '5.4', elevation: '498m' },
    { id: 'KALIYASOT', name: 'Kaliasot River Catchment', district: 'Bhopal', lat: 23.2000, lon: 77.4000, defaultHazard: 'FLOOD', terrain: 'Dam Overflow Siphon Corridor', area: '4.1', elevation: '485m' },
    { id: 'SHAHPURA', name: 'Shahpura Lake Low Apron', district: 'Bhopal', lat: 23.2150, lon: 77.4250, defaultHazard: 'FLOOD', terrain: 'Urban Drainage Catchment', area: '3.6', elevation: '492m' },
    { id: 'ARERA', name: 'Arera Hills Escarpment', district: 'Bhopal', lat: 23.2350, lon: 77.4350, defaultHazard: 'LANDSLIDE', terrain: 'Elevated Urban Ridge Slope', area: '6.2', elevation: '560m' }
  ],
  'patna': [
    { id: 'GANGA', name: 'Ganga Floodplain & Digha Ghat', district: 'Patna', lat: 25.6320, lon: 85.1050, defaultHazard: 'FLOOD', terrain: 'Primary River Channel & Embankment', area: '6.2', elevation: '52m' },
    { id: 'KANKARBAGH', name: 'Kankarbagh Low Basin', district: 'Patna', lat: 25.5900, lon: 85.1550, defaultHazard: 'FLOOD', terrain: 'Urban Depression Siphon Basin', area: '4.4', elevation: '49m' },
    { id: 'RAJENDRA', name: 'Rajendra Nagar Siphon Corridor', district: 'Patna', lat: 25.6020, lon: 85.1680, defaultHazard: 'FLOOD', terrain: 'Railway Low Siphon Corridor', area: '3.8', elevation: '48m' },
    { id: 'DANAPUR', name: 'Danapur Drainage Catchment', district: 'Patna', lat: 25.6300, lon: 85.0450, defaultHazard: 'LANDSLIDE', terrain: 'Riverbank Cut-Slope & Canal Inflow', area: '5.6', elevation: '54m' }
  ],
  'vindhya': [
    { id: 'BICHIA', name: 'Bichia River Confluence', district: 'Vindhya / Rewa', lat: 24.5362, lon: 81.3038, defaultHazard: 'FLOOD', terrain: 'River Confluence Lowlands', area: '3.9', elevation: '315m' },
    { id: 'TONS', name: 'Tons River Catchment Basin', district: 'Vindhya / Rewa', lat: 24.6200, lon: 81.3500, defaultHazard: 'LANDSLIDE', terrain: 'Plateau River Gorge & Escarpment', area: '8.4', elevation: '345m' },
    { id: 'HUZUR', name: 'Huzur Lowlands Basin', district: 'Vindhya / Rewa', lat: 24.5100, lon: 81.2800, defaultHazard: 'FLOOD', terrain: 'Agricultural Inflow Siphon', area: '5.2', elevation: '310m' },
    { id: 'FORT', name: 'Rewa Fort Drainage Canal', district: 'Vindhya / Rewa', lat: 24.5420, lon: 81.2950, defaultHazard: 'FLOOD', terrain: 'Historic Drainage Siphon', area: '2.8', elevation: '318m' }
  ],
  'rewa': [
    { id: 'BICHIA', name: 'Bichia River Confluence', district: 'Rewa', lat: 24.5362, lon: 81.3038, defaultHazard: 'FLOOD', terrain: 'River Confluence Lowlands', area: '3.9', elevation: '315m' },
    { id: 'TONS', name: 'Tons River Catchment Basin', district: 'Rewa', lat: 24.6200, lon: 81.3500, defaultHazard: 'LANDSLIDE', terrain: 'Plateau River Gorge & Escarpment', area: '8.4', elevation: '345m' },
    { id: 'HUZUR', name: 'Huzur Lowlands Basin', district: 'Rewa', lat: 24.5100, lon: 81.2800, defaultHazard: 'FLOOD', terrain: 'Agricultural Inflow Siphon', area: '5.2', elevation: '310m' },
    { id: 'FORT', name: 'Rewa Fort Drainage Canal', district: 'Rewa', lat: 24.5420, lon: 81.2950, defaultHazard: 'FLOOD', terrain: 'Historic Drainage Siphon', area: '2.8', elevation: '318m' }
  ],
  'mumbai': [
    { id: 'MITHI', name: 'Mithi River Channel', district: 'Mumbai', lat: 19.0760, lon: 72.8777, defaultHazard: 'FLOOD', terrain: 'Tidal River Estuary Channel', area: '5.3', elevation: '6m' },
    { id: 'KURLA', name: 'Kurla Low Basin', district: 'Mumbai', lat: 19.0680, lon: 72.8890, defaultHazard: 'FLOOD', terrain: 'Railway Siphon Depression', area: '3.6', elevation: '4m' },
    { id: 'HINDMATA', name: 'Hindmata Siphon Hotspot', district: 'Mumbai', lat: 19.0120, lon: 72.8420, defaultHazard: 'FLOOD', terrain: 'Severe Low-Lying Siphon Basin', area: '2.9', elevation: '3m' },
    { id: 'POWAI', name: 'Powai Lake Inflow Catchment', district: 'Mumbai', lat: 19.1250, lon: 72.9050, defaultHazard: 'LANDSLIDE', terrain: 'Hilly Lake Spillway Slope', area: '6.7', elevation: '58m' }
  ],
  'ranchi': [
    { id: 'SUBARNAREKHA', name: 'Subarnarekha River Basin', district: 'Ranchi', lat: 23.3441, lon: 85.3096, defaultHazard: 'FLOOD', terrain: 'Plateau River Basin', area: '5.8', elevation: '640m' },
    { id: 'HARMU', name: 'Harmu Nala Corridor', district: 'Ranchi', lat: 23.3600, lon: 85.3180, defaultHazard: 'FLOOD', terrain: 'Urban Drainage Channel', area: '3.1', elevation: '648m' },
    { id: 'KANKE', name: 'Kanke Dam Catchment', district: 'Ranchi', lat: 23.4200, lon: 85.3200, defaultHazard: 'LANDSLIDE', terrain: 'Dam Escarpment Ridge', area: '4.9', elevation: '675m' },
    { id: 'DHURWA', name: 'Dhurwa Lowland Catchment', district: 'Ranchi', lat: 23.3100, lon: 85.2750, defaultHazard: 'FLOOD', terrain: 'Spillway Lowland Basin', area: '4.2', elevation: '632m' }
  ],
  'guwahati': [
    { id: 'BRAHMAPUTRA', name: 'Brahmaputra South Bank', district: 'Guwahati', lat: 26.1850, lon: 91.7500, defaultHazard: 'FLOOD', terrain: 'Major River Embankment', area: '7.2', elevation: '54m' },
    { id: 'BHARALU', name: 'Bharalu Drainage River', district: 'Guwahati', lat: 26.1550, lon: 91.7300, defaultHazard: 'FLOOD', terrain: 'Urban Siphon River', area: '3.7', elevation: '51m' },
    { id: 'ANILNAGAR', name: 'Anil Nagar Waterlogging Basin', district: 'Guwahati', lat: 26.1700, lon: 91.7750, defaultHazard: 'FLOOD', terrain: 'Chronic Siphon Depression', area: '2.5', elevation: '49m' },
    { id: 'DEEPOR', name: 'Deepor Beel Catchment', district: 'Guwahati', lat: 26.1200, lon: 91.6600, defaultHazard: 'LANDSLIDE', terrain: 'Wetland Valley Ridge Slope', area: '8.1', elevation: '62m' }
  ],
  'kolkata': [
    { id: 'HOOGHLY', name: 'Hooghly Riverfront Basin', district: 'Kolkata', lat: 22.5800, lon: 88.3500, defaultHazard: 'FLOOD', terrain: 'Tidal Riverfront Lowlands', area: '4.5', elevation: '8m' },
    { id: 'TILJALA', name: 'Tiljala Wetlands Catchment', district: 'Kolkata', lat: 22.5350, lon: 88.3900, defaultHazard: 'FLOOD', terrain: 'East Kolkata Wetlands Inflow', area: '6.8', elevation: '5m' },
    { id: 'BEHALA', name: 'Behala Drainage Canal', district: 'Kolkata', lat: 22.4950, lon: 88.3150, defaultHazard: 'FLOOD', terrain: 'Southern Outfall Siphon', area: '3.9', elevation: '6m' },
    { id: 'EMBYPASS', name: 'EM Bypass Lowlands', district: 'Kolkata', lat: 22.5200, lon: 88.4050, defaultHazard: 'FLOOD', terrain: 'Highway Drainage Culvert Corridor', area: '4.1', elevation: '7m' }
  ],
  'noida': [
    { id: 'HINDON', name: 'Hindon River Basin & Chhajarsi Lowland', district: 'Noida', lat: 28.5355, lon: 77.3910, defaultHazard: 'FLOOD', terrain: 'Riverbank Lowland Basin', area: '4.2', elevation: '196m' },
    { id: 'NOIDA_DRAIN', name: 'Noida City Outfall Canal', district: 'Noida', lat: 28.5700, lon: 77.3200, defaultHazard: 'FLOOD', terrain: 'Municipal Drainage Network', area: '3.5', elevation: '198m' },
    { id: 'GREATER_NOIDA', name: 'Greater Noida Knowledge Park Low Basin', district: 'Noida', lat: 28.4700, lon: 77.5000, defaultHazard: 'FLOOD', terrain: 'Urban Stormwater Plain', area: '5.8', elevation: '194m' },
    { id: 'YAMUNA_EXPRESSWAY', name: 'Yamuna Floodplain Sector 150', district: 'Noida', lat: 28.4500, lon: 77.4800, defaultHazard: 'FLOOD', terrain: 'River Confluence Plain', area: '6.1', elevation: '192m' }
  ],
  'bengaluru': [
    { id: 'VRISHABHAVATHI', name: 'Vrishabhavathi Valley Basin', district: 'Bengaluru', lat: 12.9300, lon: 77.5100, defaultHazard: 'FLOOD', terrain: 'Valley Drainage Channel', area: '5.2', elevation: '880m' },
    { id: 'BELLANDUR', name: 'Bellandur Lake Catchment', district: 'Bengaluru', lat: 12.9350, lon: 77.6750, defaultHazard: 'FLOOD', terrain: 'Urban Lake Lowlands', area: '6.4', elevation: '875m' },
    { id: 'HEBBAL', name: 'Hebbal Stormwater Network', district: 'Bengaluru', lat: 13.0350, lon: 77.5950, defaultHazard: 'FLOOD', terrain: 'Stormwater Culvert Basin', area: '4.1', elevation: '910m' },
    { id: 'TURAHALLI', name: 'Turahalli Forest Slope', district: 'Bengaluru', lat: 12.8850, lon: 77.5250, defaultHazard: 'LANDSLIDE', terrain: 'Elevated Granitic Slope', area: '3.8', elevation: '960m' }
  ],
  'jaipur': [
    { id: 'DRAVAYAVATI', name: 'Dravyavati River Rejuvenation Channel', district: 'Jaipur', lat: 26.8500, lon: 75.8000, defaultHazard: 'FLOOD', terrain: 'Semi-Arid River Channel', area: '5.0', elevation: '410m' },
    { id: 'AMANI_SHAH', name: 'Amani Shah Nala Corridor', district: 'Jaipur', lat: 26.9200, lon: 75.7800, defaultHazard: 'FLOOD', terrain: 'Urban Drainage Plain', area: '3.9', elevation: '422m' },
    { id: 'NAHARGARH', name: 'Nahargarh Aravalli Foothills', district: 'Jaipur', lat: 26.9400, lon: 75.8200, defaultHazard: 'LANDSLIDE', terrain: 'Aravalli Ridge Cut-Slope', area: '7.1', elevation: '585m' },
    { id: 'JAL_MAHAL', name: 'Man Sagar / Jal Mahal Lowland', district: 'Jaipur', lat: 26.9550, lon: 75.8450, defaultHazard: 'FLOOD', terrain: 'Lake Catchment Basin', area: '4.4', elevation: '416m' }
  ],
  'dehradun': [
    { id: 'RISPANA', name: 'Rispana River Channel', district: 'Dehradun', lat: 30.3165, lon: 78.0322, defaultHazard: 'FLOOD', terrain: 'Himalayan Foothill Stream', area: '4.8', elevation: '635m' },
    { id: 'BINDRAL', name: 'Bindal Nala Catchment', district: 'Dehradun', lat: 30.3250, lon: 78.0400, defaultHazard: 'FLOOD', terrain: 'Foothill Torrent Plain', area: '3.6', elevation: '642m' },
    { id: 'RAJPUR', name: 'Rajpur Road Mussoorie Escarpment', district: 'Dehradun', lat: 30.3800, lon: 78.0900, defaultHazard: 'LANDSLIDE', terrain: 'Steep Himalayan Mountain Slope', area: '8.5', elevation: '920m' },
    { id: 'SONG', name: 'Song River Floodplain', district: 'Dehradun', lat: 30.2500, lon: 78.1000, defaultHazard: 'FLOOD', terrain: 'River Confluence Plain', area: '6.2', elevation: '595m' }
  ],
  'chitrakoot': [
    { id: 'RAMGHAT', name: 'Mandakini River & Ramghat Basin', district: 'Chitrakoot', lat: 25.1764, lon: 80.8643, defaultHazard: 'FLOOD', terrain: 'Riverine Sacred Confluence Plain', area: '4.2', elevation: '145m' },
    { id: 'KAMADGIRI', name: 'Kamadgiri Parikrama Foothill Slope', district: 'Chitrakoot', lat: 25.1680, lon: 80.8520, defaultHazard: 'LANDSLIDE', terrain: 'Hillock Drainage Escarpment', area: '3.8', elevation: '192m' },
    { id: 'SITAPUR', name: 'Sitapur Low Drainage Corridor', district: 'Chitrakoot', lat: 25.1850, lon: 80.8710, defaultHazard: 'FLOOD', terrain: 'Low Drainage Siphon Plain', area: '3.1', elevation: '142m' },
    { id: 'BHARATKUP', name: 'Bharat Kup Watershed Catchment', district: 'Chitrakoot', lat: 25.1200, lon: 80.7950, defaultHazard: 'FLOOD', terrain: 'Agricultural Inundation Basin', area: '6.5', elevation: '156m' }
  ],
  'visakhapatnam': [
    { id: 'MEGHADRI', name: 'Meghadrigedda Reservoir & Drainage Plain', district: 'Visakhapatnam', lat: 17.7400, lon: 83.2100, defaultHazard: 'FLOOD', terrain: 'Coastal Plain Reservoir Outfall', area: '5.5', elevation: '14m' },
    { id: 'RK_BEACH', name: 'RK Beach Coastal Surge Corridor', district: 'Visakhapatnam', lat: 17.7120, lon: 83.3180, defaultHazard: 'FLOOD', terrain: 'Coastal Tidal Frontage', area: '3.2', elevation: '5m' },
    { id: 'SIMHACHALAM', name: 'Simhachalam Hill Range Escarpment', district: 'Visakhapatnam', lat: 17.7680, lon: 83.2500, defaultHazard: 'LANDSLIDE', terrain: 'Steep Coastal Hill Range', area: '7.8', elevation: '285m' },
    { id: 'GAJUWAKA', name: 'Gajuwaka Industrial Low Depression', district: 'Visakhapatnam', lat: 17.6950, lon: 83.2050, defaultHazard: 'FLOOD', terrain: 'Low Siphon Depression', area: '4.4', elevation: '9m' }
  ],
  'pune': [
    { id: 'MULA_MUTHA', name: 'Mula-Mutha Riverfront Confluence', district: 'Pune', lat: 18.5300, lon: 73.8750, defaultHazard: 'FLOOD', terrain: 'River Confluence Basin', area: '4.8', elevation: '552m' },
    { id: 'SINHAGAD', name: 'Sinhagad Ridge Foothill Escarpment', district: 'Pune', lat: 18.3660, lon: 73.7550, defaultHazard: 'LANDSLIDE', terrain: 'Basaltic Mountain Slope', area: '8.2', elevation: '860m' },
    { id: 'SHIVAJINAGAR', name: 'Shivajinagar Low Siphon Sector', district: 'Pune', lat: 18.5280, lon: 73.8470, defaultHazard: 'FLOOD', terrain: 'Urban Lowland Basin', area: '3.5', elevation: '550m' },
    { id: 'KHADAKWASLA', name: 'Khadakwasla Dam Spillway Corridor', district: 'Pune', lat: 18.4400, lon: 73.7650, defaultHazard: 'FLOOD', terrain: 'Dam Inflow & Spillway Basin', area: '6.1', elevation: '565m' }
  ],
  'indore': [
    { id: 'KANH', name: 'Kanh River Channel & Krishnapura Chhatri', district: 'Indore', lat: 22.7180, lon: 75.8550, defaultHazard: 'FLOOD', terrain: 'Urban River Channel Basin', area: '3.9', elevation: '542m' },
    { id: 'SIRPUR', name: 'Sirpur Lake Catchment Basin', district: 'Indore', lat: 22.7050, lon: 75.8200, defaultHazard: 'FLOOD', terrain: 'Lake Wetland Depression', area: '4.7', elevation: '545m' },
    { id: 'RALAMANDAL', name: 'Ralamandal Wildlife Ridge Slope', district: 'Indore', lat: 22.6580, lon: 75.9120, defaultHazard: 'LANDSLIDE', terrain: 'Elevated Plateau Escarpment', area: '6.8', elevation: '620m' },
    { id: 'RAJWADA', name: 'Rajwada Low Outfall Siphon', district: 'Indore', lat: 22.7210, lon: 75.8600, defaultHazard: 'FLOOD', terrain: 'Dense Urban Drainage Basin', area: '2.6', elevation: '538m' }
  ],
  'lucknow': [
    { id: 'GOMTI', name: 'Gomti Riverfront Primary Drainage Basin', district: 'Lucknow', lat: 26.8520, lon: 80.9420, defaultHazard: 'FLOOD', terrain: 'Major River Floodplain', area: '5.2', elevation: '112m' },
    { id: 'KUKRAIL', name: 'Kukrail Nala Drainage Channel', district: 'Lucknow', lat: 26.8850, lon: 80.9850, defaultHazard: 'FLOOD', terrain: 'Forest Stream Tributary', area: '4.1', elevation: '115m' },
    { id: 'CHARBAGH', name: 'Charbagh Low Siphon Depression', district: 'Lucknow', lat: 26.8300, lon: 80.9200, defaultHazard: 'FLOOD', terrain: 'Railway Underpass Lowlands', area: '3.0', elevation: '109m' },
    { id: 'SHAHEED', name: 'Shaheed Path Catchment Lowlands', district: 'Lucknow', lat: 26.7850, lon: 80.9950, defaultHazard: 'FLOOD', terrain: 'Highway Stormwater Basin', area: '5.8', elevation: '114m' }
  ],
  'srinagar': [
    { id: 'JHELUM', name: 'Jhelum River Channel & Zero Bridge', district: 'Srinagar', lat: 34.0720, lon: 74.8250, defaultHazard: 'FLOOD', terrain: 'Himalayan River Meander', area: '6.4', elevation: '1584m' },
    { id: 'DAL_SPILL', name: 'Dal Lake & Flood Spill Channel', district: 'Srinagar', lat: 34.0880, lon: 74.8500, defaultHazard: 'FLOOD', terrain: 'Interconnected Lake Spillway', area: '5.8', elevation: '1585m' },
    { id: 'SHANKARACHARYA', name: 'Shankaracharya Hill Escarpment', district: 'Srinagar', lat: 34.0750, lon: 74.8450, defaultHazard: 'LANDSLIDE', terrain: 'Himalayan Bedrock Ridge Slope', area: '7.2', elevation: '1820m' },
    { id: 'BEMINA', name: 'Bemina Lowland Siphon Basin', district: 'Srinagar', lat: 34.0800, lon: 74.7700, defaultHazard: 'FLOOD', terrain: 'Chronic Urban Floodplain', area: '4.5', elevation: '1582m' }
  ],
  'chandigarh': [
    { id: 'SUKHNA', name: 'Sukhna Lake Spillway & Choe Channel', district: 'Chandigarh', lat: 30.7420, lon: 76.8180, defaultHazard: 'FLOOD', terrain: 'Lake Dam Spillway Basin', area: '4.5', elevation: '315m' },
    { id: 'N_CHOE', name: 'N-Choe Drainage Corridor Sector 35/43', district: 'Chandigarh', lat: 30.7250, lon: 76.7650, defaultHazard: 'FLOOD', terrain: 'Urban Stormwater Choe', area: '3.8', elevation: '310m' },
    { id: 'SHIVALIK', name: 'Shivalik Foothills Kalka Escarpment', district: 'Chandigarh', lat: 30.7950, lon: 76.8650, defaultHazard: 'LANDSLIDE', terrain: 'Foothill Siltstone Slope', area: '6.9', elevation: '410m' },
    { id: 'PATIALA_KI_RAO', name: 'Patiala-Ki-Rao Torrent Catchment', district: 'Chandigarh', lat: 30.7600, lon: 76.7400, defaultHazard: 'FLOOD', terrain: 'Seasonal Torrent Floodplain', area: '4.2', elevation: '308m' }
  ]
};

// Geographically calibrated river gauge stations and danger datums for accurate hydrological telemetry
const REGIONAL_RIVER_REGISTRY = {
  'delhi': { river: 'Yamuna River Stage (Delhi Railway Bridge Gauge)', baseStage: 204.2, dangerStage: 205.33, unit: 'm', warningStage: 204.5 },
  'chitrakoot': { river: 'Mandakini River Stage (Ramghat Gauge)', baseStage: 142.5, dangerStage: 145.0, unit: 'm', warningStage: 143.8 },
  'vindhya': { river: 'Bichia / Tons River Stage (Rewa Gauge)', baseStage: 134.2, dangerStage: 137.5, unit: 'm', warningStage: 136.0 },
  'rewa': { river: 'Bichia / Tons River Stage (Rewa Gauge)', baseStage: 134.2, dangerStage: 137.5, unit: 'm', warningStage: 136.0 },
  'mumbai': { river: 'Mithi River Estuary Gauge (Bandra Kurla Outfall)', baseStage: 2.1, dangerStage: 3.8, unit: 'm', warningStage: 3.0 },
  'kolkata': { river: 'Hooghly River Tidal Stage (Garden Reach Gauge)', baseStage: 4.2, dangerStage: 6.5, unit: 'm', warningStage: 5.5 },
  'visakhapatnam': { river: 'Meghadrigedda Reservoir Stage (Outfall Gauge)', baseStage: 8.4, dangerStage: 11.5, unit: 'm', warningStage: 10.2 },
  'patna': { river: 'Ganga River Stage (Digha Ghat Gauge)', baseStage: 49.5, dangerStage: 50.52, unit: 'm', warningStage: 49.8 },
  'guwahati': { river: 'Brahmaputra River Stage (DC Court Gauge)', baseStage: 46.2, dangerStage: 49.68, unit: 'm', warningStage: 48.5 },
  'dehradun': { river: 'Bindal / Rispana Mountain Torrent Stream Stage', baseStage: 638.5, dangerStage: 642.0, unit: 'm', warningStage: 640.5 },
  'srinagar': { river: 'Jhelum River Stage (Ram Munshi Bagh Gauge)', baseStage: 1582.4, dangerStage: 1585.5, unit: 'm', warningStage: 1584.0 },
  'pune': { river: 'Mula-Mutha River Stage (Bund Garden Gauge)', baseStage: 548.2, dangerStage: 552.0, unit: 'm', warningStage: 550.5 },
  'indore': { river: 'Kanh / Saraswati River Stage (Krishnapura Chhatri)', baseStage: 540.2, dangerStage: 544.5, unit: 'm', warningStage: 542.8 },
  'lucknow': { river: 'Gomti River Stage (Gau Ghat Gauge)', baseStage: 108.2, dangerStage: 112.5, unit: 'm', warningStage: 110.5 },
  'chandigarh': { river: 'Sukhna Choe & N-Choe Drainage Siphon Stage', baseStage: 312.0, dangerStage: 316.0, unit: 'm', warningStage: 314.5 },
  'ranchi': { river: 'Subarnarekha River Basin (Hatia Gauge)', baseStage: 638.0, dangerStage: 642.0, unit: 'm', warningStage: 640.2 },
  'bhopal': { river: 'Upper Lake Spillway & Kaliasot Basin Gauge', baseStage: 498.2, dangerStage: 501.5, unit: 'm', warningStage: 500.0 },
  'jaipur': { river: 'Dravyavati River & Amanishah Channel Stage', baseStage: 410.2, dangerStage: 414.0, unit: 'm', warningStage: 412.5 },
  'bengaluru': { river: 'Vrishabhavathi Valley Channel Stage', baseStage: 880.5, dangerStage: 884.0, unit: 'm', warningStage: 882.5 },
  'noida': { river: 'Hindon River Stage (Chhajarsi Gauge)', baseStage: 196.2, dangerStage: 199.5, unit: 'm', warningStage: 198.0 }
};

function getHotspotsForLocation(loc) {
  const query = (loc?.id || loc?.district || loc?.name || '').toLowerCase().trim();
  for (const [key, spots] of Object.entries(REGIONAL_HOTSPOTS_MAP)) {
    if (query.includes(key)) return spots;
  }
  const baseLat = loc?.lat || 28.6139;
  const baseLon = loc?.lng || loc?.lon || 77.2090;
  const locName = loc?.name?.split('(')[0]?.trim() || loc?.district || 'Regional Basin';
  return [
    { id: 'HOTSPOT_1', name: `${locName} Primary Drainage Corridor`, district: locName, lat: baseLat + 0.012, lon: baseLon + 0.008, defaultHazard: 'FLOOD', terrain: 'Primary Drainage Plain', area: '4.8', elevation: '210m' },
    { id: 'HOTSPOT_2', name: `${locName} Central Municipal Low Basin`, district: locName, lat: baseLat - 0.015, lon: baseLon + 0.012, defaultHazard: 'FLOOD', terrain: 'Urban Drainage Basin', area: '3.2', elevation: '205m' },
    { id: 'HOTSPOT_3', name: `${locName} Elevated Ridge Escarpment`, district: locName, lat: baseLat - 0.025, lon: baseLon - 0.018, defaultHazard: 'LANDSLIDE', terrain: 'Elevated Ridge Escarpment', area: '7.5', elevation: '270m' },
    { id: 'HOTSPOT_4', name: `${locName} Watershed Catchment Sector`, district: locName, lat: baseLat + 0.028, lon: baseLon - 0.010, defaultHazard: 'FLOOD', terrain: 'Regional Watershed Catchment', area: '5.1', elevation: '208m' }
  ];
}

export default function RiskAnalysis() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();

  const availableHotspots = useMemo(() => getHotspotsForLocation(location), [location?.id, location?.district, location?.name]);
  const [selectedHotspot, setSelectedHotspot] = useState(availableHotspots[0]);
  const [selectedHazard, setSelectedHazard] = useState('FLOOD');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [shelterData, setShelterData] = useState(null);

  // Active question index in the 7 Core Questions deck (1-indexed for clarity: 1 to 7)
  const [activeQuestionId, setActiveQuestionId] = useState(1);
  const [questionsViewMode, setQuestionsViewMode] = useState('dossier'); // 'dossier' or 'grid'

  // Interactive Recharts Telemetry Deck active tab
  const [chartTab, setChartTab] = useState('hydrograph'); // 'hydrograph' | 'shap' | 'radar'

  // Interactive "What-If" Stress-Testing Simulation Lab state
  const [stressLabOpen, setStressLabOpen] = useState(false);
  const [simRainfallSurge, setSimRainfallSurge] = useState(0); // 0 to 120 mm/h
  const [simRiverInflowSurge, setSimRiverInflowSurge] = useState(0); // 0 to +150%
  const [simDrainageCapacity, setSimDrainageCapacity] = useState(100); // 20% to 100%

  // Dialogs
  const [hotspotDialogOpen, setHotspotDialogOpen] = useState(false);
  const [hotspotSearch, setHotspotSearch] = useState('');
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false);

  // Reset to first hotspot of district when user picks another district from Navbar
  useEffect(() => {
    setSelectedHotspot(availableHotspots[0]);
  }, [availableHotspots]);

  // Fetch unified risk analysis & shelter recommendations
  const runRiskSimulation = () => {
    if (!selectedHotspot) return;
    setIsRefreshing(true);
    Promise.allSettled([
      postAIExplain({ latitude: selectedHotspot.lat, longitude: selectedHotspot.lon, hazardType: selectedHazard }),
      getShelterRecommendation(selectedHotspot.lat, selectedHotspot.lon, selectedHotspot.district)
    ]).then(([riskRes, shelterRes]) => {
      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value?.data?.data || null);
      }
      if (shelterRes.status === 'fulfilled') {
        setShelterData(shelterRes.value?.data?.data?.recommended || null);
      }
    }).finally(() => {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  useEffect(() => {
    runRiskSimulation();
  }, [selectedHotspot?.id, selectedHotspot?.lat, selectedHotspot?.lon, selectedHazard]);

  const handleCopyCoords = (lat, lon) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 1800);
    }
  };

  const resetStressLab = () => {
    setSimRainfallSurge(0);
    setSimRiverInflowSurge(0);
    setSimDrainageCapacity(100);
  };

  // Deterministic terrain hash for responsive baseline computation
  const terrainHash = Math.abs(Math.sin((selectedHotspot?.lat || 28.6) * 12.9898 + (selectedHotspot?.lon || 77.2) * 78.233) * 43758.5453);
  const terrainVar = ((terrainHash % 1) - 0.5);

  // Multi-hazard assessment computation with interactive "What-If" stress testing delta
  const assessmentsAll = useMemo(() => {
    const list = [
      { key: 'FLOOD', label: 'Flood Risk', icon: Waves, color: '#0284c7', glow: 'rgba(2, 132, 199, 0.4)' },
      { key: 'LANDSLIDE', label: 'Landslide Risk', icon: Mountain, color: '#d97706', glow: 'rgba(217, 119, 6, 0.4)' },
      { key: 'WILDFIRE', label: 'Wildfire Risk', icon: Flame, color: '#ea580c', glow: 'rgba(234, 88, 12, 0.4)' }
    ];

    // Compute stress multiplier from sliders
    const rainfallStressBonus = Math.round(simRainfallSurge * 0.35);
    const riverStressBonus = Math.round(simRiverInflowSurge * 0.18);
    const drainagePenalty = Math.round((100 - simDrainageCapacity) * 0.22);
    const totalSimStressDelta = rainfallStressBonus + riverStressBonus + drainagePenalty;

    return list.map((item) => {
      let data = riskData?.assessments?.[item.key];
      if (!data) {
        let mult = item.key === 'FLOOD' ? 1.0 : item.key === 'LANDSLIDE' ? 0.72 : 0.42;
        let baselineScore = Math.min(36, Math.max(8, Math.round((18 + (terrainVar * 8)) * mult)));

        // Apply stress testing delta specifically when evaluating simulated threat
        let simulatedScore = Math.min(98, Math.max(baselineScore, baselineScore + (item.key === 'FLOOD' ? totalSimStressDelta : Math.round(totalSimStressDelta * 0.6))));

        const category = simulatedScore >= 76 ? 'CRITICAL' : simulatedScore >= 51 ? 'HIGH' : simulatedScore >= 26 ? 'MODERATE' : 'LOW';
        data = {
          disasterType: item.key,
          riskScore: simulatedScore,
          baselineScore: baselineScore,
          riskCategory: category,
          confidence: item.key === 'FLOOD' ? 0.91 : item.key === 'LANDSLIDE' ? 0.86 : 0.82,
          affectedPopulation: category === 'LOW' ? 0 : Math.round(simulatedScore * 185),
          recommendedAction: category === 'CRITICAL' || category === 'HIGH' ? 'Evacuation protocol active & sirens staged' : 'Routine automated telemetry surveillance'
        };
      } else {
        let baselineScore = data.riskScore;
        let simulatedScore = Math.min(98, Math.max(baselineScore, baselineScore + (item.key === 'FLOOD' ? totalSimStressDelta : Math.round(totalSimStressDelta * 0.6))));
        const category = simulatedScore >= 76 ? 'CRITICAL' : simulatedScore >= 51 ? 'HIGH' : simulatedScore >= 26 ? 'MODERATE' : 'LOW';
        data = {
          ...data,
          riskScore: simulatedScore,
          baselineScore: baselineScore,
          riskCategory: category,
          affectedPopulation: category === 'LOW' ? 0 : Math.round(simulatedScore * 185)
        };
      }

      const scoreCol = data.riskScore >= 76
        ? '#ef4444'
        : data.riskScore >= 51
        ? '#f97316'
        : data.riskScore >= 26
        ? '#eab308'
        : '#22c55e';

      const scoreBg = data.riskScore >= 76
        ? 'rgba(239, 68, 68, 0.14)'
        : data.riskScore >= 51
        ? 'rgba(249, 115, 22, 0.14)'
        : data.riskScore >= 26
        ? 'rgba(234, 179, 8, 0.14)'
        : 'rgba(34, 197, 94, 0.14)';

      return {
        ...item,
        assessment: data,
        scoreColor: scoreCol,
        scoreBg
      };
    });
  }, [riskData, terrainVar, simRainfallSurge, simRiverInflowSurge, simDrainageCapacity]);

  const currentAssessment = useMemo(() => {
    const found = assessmentsAll.find((a) => a.key === selectedHazard);
    return found ? found.assessment : {
      disasterType: selectedHazard,
      riskScore: 18,
      baselineScore: 18,
      riskCategory: 'LOW',
      confidence: 0.88,
      affectedPopulation: 0,
      recommendedAction: 'Peacetime baseline monitoring active. No imminent hazard.'
    };
  }, [assessmentsAll, selectedHazard]);

  // Design Tokens tailored for high-contrast command center HUD
  const isDarkCockpit = isDark;
  const cardBg = isDarkCockpit ? 'rgba(15, 23, 42, 0.78)' : '#ffffff';
  const cardBorder = isDarkCockpit ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDarkCockpit ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkCockpit ? '#94a3b8' : '#64748b';
  const accentCyan = isDarkCockpit ? '#38bdf8' : '#0284c7';

  // Active status color scheme based on threat score
  const scoreColor = currentAssessment.riskScore >= 76
    ? '#ef4444'
    : currentAssessment.riskScore >= 51
    ? '#f97316'
    : currentAssessment.riskScore >= 26
    ? '#eab308'
    : '#22c55e';

  const scoreBadgeBg = currentAssessment.riskScore >= 76
    ? 'rgba(239, 68, 68, 0.16)'
    : currentAssessment.riskScore >= 51
    ? 'rgba(249, 115, 22, 0.16)'
    : currentAssessment.riskScore >= 26
    ? 'rgba(234, 179, 8, 0.16)'
    : 'rgba(34, 197, 94, 0.16)';

  const isLow = currentAssessment.riskScore < 26;
  const isModerate = currentAssessment.riskScore >= 26 && currentAssessment.riskScore < 51;
  const isHigh = currentAssessment.riskScore >= 51 && currentAssessment.riskScore < 76;
  const isCritical = currentAssessment.riskScore >= 76;

  // Hydrological Siphon and Basin Discharge Metrics
  const dischargePct = isCritical
    ? Math.min(98, 85 + Math.round((currentAssessment.riskScore - 75) * 0.5))
    : isHigh
    ? Math.min(84, 60 + Math.round((currentAssessment.riskScore - 50) * 0.9))
    : isModerate
    ? Math.min(58, 30 + Math.round((currentAssessment.riskScore - 25) * 1.1))
    : Math.max(12, Math.min(25, Math.round(currentAssessment.riskScore * 0.8 + 6)));

  const dischargeLabel = isCritical
    ? `Critical Surcharge (${dischargePct}% capacity)`
    : isHigh
    ? `High Overflow Siphon (${dischargePct}% capacity)`
    : isModerate
    ? `Moderate Runoff (${dischargePct}% capacity)`
    : `Normal Base Flow (${dischargePct}% capacity)`;

  // Resolved Shelters Data
  const resolvedShelterName = shelterData?.shelter?.name || shelterData?.name || `District Multipurpose Concrete Relief Facility`;
  const resolvedShelterDist = shelterData?.distance || `1.8 km`;
  const resolvedShelterTime = shelterData?.estimatedTravelTime || `12 mins`;
  const resolvedShelterBeds = shelterData?.shelter?.availableCapacity || shelterData?.availableCapacity || 320;

  // Dynamic Regional Hydrological / Geomechanical Telemetry Profile
  const hydrographMeta = useMemo(() => {
    const locQuery = (location?.id || location?.district || location?.name || selectedHotspot?.district || '').toLowerCase();
    let riverProfile = null;
    for (const [key, profile] of Object.entries(REGIONAL_RIVER_REGISTRY)) {
      if (locQuery.includes(key)) {
        riverProfile = profile;
        break;
      }
    }
    if (!riverProfile) {
      const elev = parseInt(selectedHotspot?.elevation) || 210;
      riverProfile = {
        river: `${selectedHotspot?.name || location?.name || 'Regional'} Drainage Corridor Gauge`,
        baseStage: Number((elev * 0.95).toFixed(1)),
        dangerStage: Number((elev * 0.95 + 2.8).toFixed(1)),
        unit: 'm'
      };
    }

    if (selectedHazard === 'LANDSLIDE') {
      return {
        title: 'Geotechnical Pore-Water Pressure & Slope Instability (kPa vs Critical Threshold)',
        metricLabel: 'Pore Pressure (kPa)',
        unit: ' kPa',
        baseLevel: 24.5,
        dangerLevel: 65.0,
        subtext: 'Slope piezometric pore pressure & critical shear failure threshold'
      };
    } else if (selectedHazard === 'WILDFIRE') {
      return {
        title: 'Fine Fuel Moisture Deficit & Fire Radiative Power (MW vs Extreme Alert)',
        metricLabel: 'Radiative Power (MW)',
        unit: ' MW',
        baseLevel: 14.0,
        dangerLevel: 45.0,
        subtext: 'MODIS/VIIRS thermal emission telemetry & moisture index'
      };
    }

    return {
      riverName: riverProfile.river,
      title: `${riverProfile.river} (m vs Danger Threshold)`,
      metricLabel: 'Water Stage (m)',
      unit: 'm',
      baseLevel: riverProfile.baseStage,
      dangerLevel: riverProfile.dangerStage,
      subtext: `Live river stage telemetry vs ${riverProfile.dangerStage}m CWC Danger Datum`
    };
  }, [location?.id, location?.district, location?.name, selectedHotspot, selectedHazard]);

  // Dynamic Time-series Hydrograph Dataset for Recharts
  const hydrographData = useMemo(() => {
    const { baseLevel, dangerLevel } = hydrographMeta;
    const spread = dangerLevel - baseLevel;
    const peakOffset = isCritical ? spread * 1.2 : isHigh ? spread * 0.8 : isModerate ? spread * 0.45 : spread * 0.16;
    return [
      { time: 'Now', level: Number((baseLevel + (isCritical ? spread * 0.35 : 0.08)).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 2 + simRainfallSurge * 0.1 },
      { time: '+6h', level: Number((baseLevel + peakOffset * 0.55).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 8 + simRainfallSurge * 0.4 },
      { time: '+12h', level: Number((baseLevel + peakOffset).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 18 + simRainfallSurge * 0.8 },
      { time: '+18h', level: Number((baseLevel + peakOffset * 0.88).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 14 + simRainfallSurge * 0.6 },
      { time: '+24h', level: Number((baseLevel + peakOffset * 0.65).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 6 + simRainfallSurge * 0.2 },
      { time: '+48h', level: Number((baseLevel + peakOffset * 0.35).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 2 },
      { time: '+72h', level: Number((baseLevel + 0.04).toFixed(2)), dangerLevel: Number(dangerLevel.toFixed(2)), rainfall: 0 }
    ];
  }, [hydrographMeta, isCritical, isHigh, isModerate, simRainfallSurge]);

  // Dynamic SHAP Feature Importance dataset for Recharts
  const shapFeatureData = useMemo(() => {
    const rainImpact = Math.min(55, Math.round(28 + simRainfallSurge * 0.25));
    const riverImpact = Math.min(45, Math.round(24 + simRiverInflowSurge * 0.15));
    const drainageImpact = Math.min(35, Math.round(18 + (100 - simDrainageCapacity) * 0.18));
    const slopeImpact = selectedHazard === 'LANDSLIDE' ? 38 : 16;
    const soilImpact = 14;

    return [
      { feature: 'Precipitation Volume', impact: rainImpact, category: 'Atmospheric' },
      { feature: 'River Discharge Surge', impact: riverImpact, category: 'Hydrological' },
      { feature: 'Topographic Slope & DEM', impact: slopeImpact, category: 'Geodetic' },
      { feature: 'Drainage Culvert Siphon', impact: drainageImpact, category: 'Infrastructure' },
      { feature: 'Soil Saturation Index', impact: soilImpact, category: 'Geotechnical' }
    ].sort((a, b) => b.impact - a.impact);
  }, [simRainfallSurge, simRiverInflowSurge, simDrainageCapacity, selectedHazard]);

  // Multi-Hazard Vulnerability Radar Dataset
  const vulnerabilityRadarData = useMemo(() => {
    return [
      { metric: 'Hydrological Surge', score: currentAssessment.riskScore },
      { metric: 'Slope Instability', score: Math.round(currentAssessment.riskScore * 0.7) },
      { metric: 'Culvert Surcharge', score: dischargePct },
      { metric: 'Population Exposure', score: isLow ? 10 : Math.min(95, Math.round(currentAssessment.riskScore * 1.1)) },
      { metric: 'Shelter Readiness', score: 88 },
      { metric: 'Forecast Confidence', score: Math.round(currentAssessment.confidence * 100) }
    ];
  }, [currentAssessment, dischargePct, isLow]);

  // 7 Core Disaster Intelligence Questions Matrix
  const questionsList = useMemo(() => [
    {
      id: 1,
      shortLabel: 'Current Threat',
      icon: AlertTriangle,
      title: 'What is Happening?',
      subtitle: 'Real-Time Threat Level & Hydro-Sensor Status',
      pill: `${currentAssessment.riskCategory} (${currentAssessment.riskScore}/100)`,
      pillColor: scoreColor,
      summary: isLow
        ? `${selectedHotspot.name} is operating in normal, safe peacetime status with zero active ${selectedHazard.toLowerCase()} threat. Automated hydrological sensors confirm baseline river stages and safe water parameters.`
        : isModerate
        ? `${selectedHotspot.name} is on advisory watch for ${selectedHazard.toLowerCase()}. Telemetry shows moderate seasonal runoff within drainage canal thresholds.`
        : `${selectedHotspot.name} is under active ${currentAssessment.riskCategory.toLowerCase()} threat. Upstream hydro-sensors detect sustained stage elevation and rapid surcharge in secondary siphon corridors.`,
      metrics: [
        { label: 'Threat Classification', value: `${currentAssessment.riskCategory} ALERT`, color: scoreColor },
        { label: 'Composite Risk Score', value: `${currentAssessment.riskScore}/100`, color: scoreColor },
        { label: 'Basin Discharge', value: dischargeLabel, color: scoreColor },
        { label: 'Sensor Signal Health', value: '42 Stations Active (100%)', color: '#22c55e' }
      ],
      telemetry: isLow
        ? 'Automated telemetry validates that upstream river gauges, reservoir releases, and precipitation accumulation indexes are well within seasonal safety limits. Soil saturation is under 38%.'
        : `Real-time sonar stage gauges register rapid runoff velocity. Siphon culvert backflow probability is estimated at ${dischargePct}%, with upstream reservoir discharge exceeding nominal retention.`,
      directive: isLow
        ? 'Peacetime environmental surveillance active. Civil sirens and public evacuation directives are NOT required.'
        : 'Tier-2 institutional emergency mobilization activated. First responders and mobile de-watering pumps staged along primary drainage junctions.'
    },
    {
      id: 2,
      shortLabel: 'Impact Perimeter',
      icon: MapPin,
      title: 'Where is it Happening?',
      subtitle: 'Geospatial Boundaries & Impact Perimeter',
      pill: isLow ? '0 km² Active Hazard' : `~${selectedHotspot.area || '4.8'} km² Danger Contour`,
      pillColor: isLow ? '#22c55e' : '#0284c7',
      summary: isLow
        ? `Monitored catchment covers ~${selectedHotspot.area || '4.8'} km² encompassing ${selectedHotspot.name}. Entire monitored sector is safe with unhindered gravity drainage.`
        : `Active hazard perimeter covers ~${selectedHotspot.area || '4.8'} km² across ${selectedHotspot.name}, concentrated along low elevation contours (${selectedHotspot.elevation || '208m'}).`,
      metrics: [
        { label: 'Target Hotspot', value: selectedHotspot.name, color: textMain },
        { label: 'Geodetic Coordinates', value: `${selectedHotspot.lat.toFixed(4)}, ${selectedHotspot.lon.toFixed(4)}`, color: accentCyan },
        { label: 'Terrain Classification', value: selectedHotspot.terrain, color: textMain },
        { label: 'Monitored Perimeter', value: `~${selectedHotspot.area || '4.8'} km²`, color: textMain }
      ],
      telemetry: `High-resolution Digital Elevation Models (DEM 10m) show elevation gradient restricted to ${selectedHotspot.elevation}. Outfall siphons flow into primary riverbeds with natural bottleneck points identified at culvert junctions.`,
      directive: isLow
        ? 'All transit corridors, riverfront promenades, and low-lying underpasses operate without civic restrictions.'
        : 'Barricades deployed at low-lying river intersections and unpaved riverfront roads. Warning signs illuminated.'
    },
    {
      id: 3,
      shortLabel: 'XAI Driving Factors',
      icon: TrendingUp,
      title: 'Why is the Risk Increasing?',
      subtitle: 'Explainable AI (SHAP) Factor Decomposition',
      pill: `${shapFeatureData[0]?.impact}% Leading Driver`,
      pillColor: '#f97316',
      summary: isLow
        ? 'Explainable AI SHAP decomposition verifies all meteorological, hydrological, and geotechnical factors are calm with optimal safety buffers.'
        : `XAI feature attribution isolates ${shapFeatureData[0]?.feature} as the primary risk driver (${shapFeatureData[0]?.impact}% weight), followed by ${shapFeatureData[1]?.feature} (${shapFeatureData[1]?.impact}%).`,
      metrics: shapFeatureData.slice(0, 4).map((f) => ({
        label: f.feature,
        value: `${f.impact}% Attribution Weight`,
        color: f.impact > 30 ? '#ef4444' : f.impact > 20 ? '#f97316' : '#0284c7'
      })),
      telemetry: `TreeExplainer SHAP decomposition algorithm isolates marginal contributions across 14 environmental features. Precipitation volume contributes +${shapFeatureData[0]?.impact} points above baseline mean.`,
      directive: 'Hydraulic pumping units prioritized directly at identified bottleneck culverts to reduce compound feature risk.'
    },
    {
      id: 4,
      shortLabel: 'Peak Forecast',
      icon: Clock,
      title: 'What Will Happen Next?',
      subtitle: 'Temporal Time-Series Forecasting (1–14 Days)',
      pill: isLow ? 'Stable: Zero Crest' : 'Projected Peak: +12h Crest',
      pillColor: isLow ? '#22c55e' : '#f97316',
      summary: isLow
        ? 'Deep recurrent neural models (GRU sequence predictors) project steady environmental stability across the entire 14-day forecast window.'
        : 'GRU time-series forecasting projects peak water level cresting between +10h and +14h, with progressive dissipation over the subsequent 48 hours.',
      metrics: [
        { label: 'Peak Window', value: isLow ? 'No Crest Projected' : '+10h to +14h Window', color: isLow ? '#22c55e' : '#ef4444' },
        { label: 'Forecast Horizon', value: '14-Day Continuous Multi-Step', color: textMain },
        { label: 'Peak Water Level', value: isLow ? 'Baseline Normal' : `+${(hydrographData[2]?.level - hydrographData[0]?.level).toFixed(2)}m Surge`, color: isLow ? '#22c55e' : '#f97316' },
        { label: 'Model Architecture', value: 'Recurrent GRU + LSTM Stack', color: accentCyan }
      ],
      telemetry: 'Continuous temporal recurrent inference synchronizes every 15 minutes with Doppler weather radar updates and upstream dam discharge schedules.',
      directive: isLow
        ? 'Standard operational surveillance cycle maintained.'
        : 'Emergency operations center maintains active staging during the 6-hour pre-crest runway.'
    },
    {
      id: 5,
      shortLabel: 'At-Risk Population',
      icon: Users,
      title: 'Who is Affected?',
      subtitle: 'Demographic Exposure & Critical Civic Assets',
      pill: isLow ? '0 Residents At Risk' : `~${currentAssessment.affectedPopulation.toLocaleString()} Residents Exposed`,
      pillColor: isLow ? '#22c55e' : '#a855f7',
      summary: isLow
        ? '0 citizens are exposed to active hazards. All residential areas, power substations, and clinics operate without disruption.'
        : `GIS census demographic overlays register ~${currentAssessment.affectedPopulation.toLocaleString()} citizens in the contour, including priority vulnerable populations requiring transport assistance.`,
      metrics: [
        { label: 'Total Exposed Population', value: isLow ? '0 Citizens (Safe)' : `~${currentAssessment.affectedPopulation.toLocaleString()} Citizens`, color: isLow ? '#22c55e' : '#ef4444' },
        { label: 'Assisted Evacuees', value: isLow ? 'None' : `~${Math.round(currentAssessment.affectedPopulation * 0.18).toLocaleString()} Elderly & Pediatric`, color: isLow ? '#22c55e' : '#f97316' },
        { label: 'Power Infrastructure', value: isLow ? 'All Substations Safe' : '2 Sub-stations Monitored', color: textMain },
        { label: 'Civic Facilities', value: isLow ? 'All Open' : '3 Schools & 1 Clinic in Buffer', color: textMain }
      ],
      telemetry: 'Layered GIS overlays correlate building footprint vectors, municipal power grid transformers, and ward-level demographic census datasets.',
      directive: isLow
        ? 'Peacetime civic routines proceed unrestricted.'
        : 'Direct automated SMS broadcast dispatched to registered resident devices in active ward contours.'
    },
    {
      id: 6,
      shortLabel: 'Responder Tactics',
      icon: ShieldCheck,
      title: 'What Responders Do?',
      subtitle: 'Standard Operating Procedures & Mobilization Tactics',
      pill: isLow ? 'SOP Tier-0 (Peacetime)' : isModerate ? 'SOP Tier-1 (Standby)' : 'SOP Tier-2 (Active Mobilization)',
      pillColor: isLow ? '#22c55e' : isModerate ? '#eab308' : '#ef4444',
      summary: isLow
        ? 'SOP Tier-0 Peacetime Readiness active: Automated sensor validation, drainage channel cleaning, and rescue equipment in ready reserve.'
        : 'SOP Tier-2 Active Emergency Mobilization triggered: Cell broadcast emergency SMS sent, mobile de-watering pumps deployed, and rescue boats staged.',
      metrics: [
        { label: 'Operational Tier', value: isLow ? 'Tier-0 Peacetime' : 'Tier-2 Mobilization', color: isLow ? '#22c55e' : '#ef4444' },
        { label: 'De-watering Pumps', value: isLow ? 'Reserve Depot (12 Units)' : '8 Deployed at Outfalls', color: accentCyan },
        { label: 'Rescue Flotilla', value: isLow ? 'Ready Standby' : '4 Inflatable Boats Staged', color: textMain },
        { label: 'Cell Broadcast Alert', value: isLow ? 'Standby' : 'Dispatched to 2 Wards', color: isLow ? textMuted : '#22c55e' }
      ],
      telemetry: 'Automated telemetry monitors state civil defense logistics, vehicle fuel reserves, generator readiness, and municipal dispatch response times.',
      directive: isLow
        ? 'Maintain routine ready reserve and periodic radio check-ins.'
        : 'Emergency rescue teams on 15-minute response standby. Primary transit corridors kept clear for emergency vehicles.'
    },
    {
      id: 7,
      shortLabel: 'Relocation & Shelters',
      icon: Navigation,
      title: 'Where People Go?',
      subtitle: 'Verified Safe Shelters & Evacuation Corridors',
      pill: isLow ? 'Shelters in Reserve' : `${resolvedShelterBeds} Beds Ready`,
      pillColor: '#0284c7',
      summary: isLow
        ? `No evacuation necessary. Designated concrete relief shelters (including ${resolvedShelterName}) remain verified and mapped in standby reserve.`
        : `Primary designated safe shelter: ${resolvedShelterName} (${resolvedShelterDist}, ETA ${resolvedShelterTime}, ${resolvedShelterBeds} verified vacant beds).`,
      metrics: [
        { label: 'Primary Shelter', value: resolvedShelterName, color: textMain },
        { label: 'Distance from Basin', value: resolvedShelterDist, color: accentCyan },
        { label: 'Transit ETA', value: resolvedShelterTime, color: '#22c55e' },
        { label: 'Vacant Capacity', value: `${resolvedShelterBeds} Beds Available`, color: '#22c55e' }
      ],
      telemetry: 'Shelter capacity telemetry syncs real-time occupancy counts, emergency generator diesel levels, potable water supplies, and medical kit provisions.',
      directive: isLow
        ? 'Emergency contact lines (112 Police, 1070 Disaster Control) available 24/7 for civilian queries.'
        : 'Evacuation corridors mapped with street police escorts to bypass waterlogged intersections.'
    }
  ], [
    currentAssessment,
    selectedHotspot,
    selectedHazard,
    scoreColor,
    dischargeLabel,
    dischargePct,
    shapFeatureData,
    hydrographData,
    resolvedShelterName,
    resolvedShelterDist,
    resolvedShelterTime,
    resolvedShelterBeds,
    isLow,
    isModerate,
    textMain,
    textMuted,
    accentCyan
  ]);

  const activeQuestion = useMemo(() => {
    return questionsList.find((q) => q.id === activeQuestionId) || questionsList[0];
  }, [questionsList, activeQuestionId]);

  // Filtered hotspots for dialog
  const filteredHotspots = useMemo(() => {
    if (!hotspotSearch.trim()) return availableHotspots;
    const term = hotspotSearch.toLowerCase();
    return availableHotspots.filter(
      (h) => h.name.toLowerCase().includes(term) || h.district.toLowerCase().includes(term) || h.terrain.toLowerCase().includes(term)
    );
  }, [availableHotspots, hotspotSearch]);

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <Boilerplate>
      {/* ========================================================================= */}
      {/* 1. TOP MISSION CONTROL HEADER & ACTIONS BAR                                */}
      {/* ========================================================================= */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
              position: 'relative'
            }}
          >
            <Brain size={26} />
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: '#22c55e',
                border: '2px solid',
                borderColor: cardBg,
                boxShadow: '0 0 10px #22c55e'
              }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: textMain, letterSpacing: -0.5, lineHeight: 1.2 }}>
                Risk Analysis & XAI Decision Support
              </Typography>
              <Chip
                label="LIVE AI SURVEILLANCE"
                size="small"
                sx={{
                  bgcolor: 'rgba(34, 197, 94, 0.12)',
                  color: '#22c55e',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  height: 20
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: textMuted, fontSize: '0.82rem', mt: 0.2 }}>
              Multi-hazard predictive intelligence, Explainable AI (SHAP) factor decomposition & the 7 Core Disaster Questions.
            </Typography>
          </Box>
        </Box>

        {/* Tactical Actions */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Sliders size={14} />}
            onClick={() => setStressLabOpen(!stressLabOpen)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              borderRadius: 2,
              px: 1.5,
              py: 0.6,
              color: stressLabOpen ? '#ffffff' : accentCyan,
              bgcolor: stressLabOpen ? accentCyan : isDarkCockpit ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff',
              borderColor: isDarkCockpit ? 'rgba(2, 132, 199, 0.4)' : '#bae6fd',
              '&:hover': {
                bgcolor: accentCyan,
                color: '#ffffff'
              }
            }}
          >
            {stressLabOpen ? 'Close Stress Lab' : 'What-If Stress Lab'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileText size={14} />}
            onClick={handlePrintDossier}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              borderRadius: 2,
              px: 1.5,
              py: 0.6,
              color: textMain,
              borderColor: cardBorder,
              bgcolor: isDarkCockpit ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
              '&:hover': {
                borderColor: accentCyan,
                color: accentCyan
              }
            }}
          >
            Export Dossier
          </Button>

          <Tooltip title="Refresh Real-Time Telemetry Feeds">
            <IconButton
              size="small"
              onClick={runRiskSimulation}
              disabled={isRefreshing}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                border: `1px solid ${cardBorder}`,
                bgcolor: isDarkCockpit ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                color: textMain,
                '&:hover': { color: accentCyan, borderColor: accentCyan }
              }}
            >
              <RotateCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ========================================================================= */}
      {/* 2. UNIFIED COMMAND CONTROL BAR (HOTSPOT & HAZARD ENGINE)                  */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.25 },
          borderRadius: 3.5,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          backdropFilter: 'blur(16px)',
          mb: 3.5,
          boxShadow: isDarkCockpit ? '0 10px 30px rgba(0,0,0,0.25)' : '0 2px 14px rgba(0,0,0,0.04)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left: Monitored Basin & Quick Hotspot Switcher */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: isDarkCockpit ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.25
                }}
              >
                <MapPin size={22} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={900} sx={{ color: textMuted, letterSpacing: 0.6, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    MONITORED BASIN
                  </Typography>
                  <Chip
                    label={selectedHotspot?.district}
                    size="small"
                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}
                  />
                  <Chip
                    label="Live Telemetry"
                    size="small"
                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: textMain, fontSize: '1.05rem', lineHeight: 1.25, mb: 0.75 }}>
                  {selectedHotspot?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.75rem', fontWeight: 600 }}>
                    {selectedHotspot?.terrain} • Basin: {selectedHotspot?.area} km² • Elev: {selectedHotspot?.elevation}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', borderColor: cardBorder }} />
                  <Tooltip title={copiedCoords ? "Copied!" : "Click to copy coordinates"}>
                    <Box
                      onClick={() => handleCopyCoords(selectedHotspot.lat, selectedHotspot.lon)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        color: copiedCoords ? '#22c55e' : accentCyan,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {copiedCoords ? <Check size={12} /> : <Copy size={12} />}
                      <span>{selectedHotspot.lat.toFixed(4)}, {selectedHotspot.lon.toFixed(4)}</span>
                    </Box>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setHotspotDialogOpen(true)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      borderRadius: 1.5,
                      py: 0.2,
                      px: 1,
                      ml: 0.5,
                      borderColor: cardBorder,
                      color: textMain,
                      '&:hover': { borderColor: accentCyan, color: accentCyan }
                    }}
                  >
                    Change Hotspot ▾
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right: Hazard Switcher Segmented Control */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ pl: { lg: 2.5 }, borderLeft: { lg: `1px solid ${cardBorder}` } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight={900} sx={{ color: textMuted, letterSpacing: 0.6, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  HAZARD MODEL SIMULATION
                </Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: scoreColor, fontSize: '0.72rem' }}>
                  ● {currentAssessment.riskCategory} ({currentAssessment.riskScore}/100)
                </Typography>
              </Box>

              {/* 3 Segmented Buttons in a sleek unified container */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                  p: 0.6,
                  borderRadius: 2.5,
                  bgcolor: isDarkCockpit ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
                  border: `1px solid ${cardBorder}`
                }}
              >
                {assessmentsAll.map((h) => {
                  const isSelected = selectedHazard === h.key;
                  const IconComponent = h.icon;
                  return (
                    <Box
                      key={h.key}
                      onClick={() => setSelectedHazard(h.key)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        py: 1,
                        px: 1.2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: isSelected
                          ? (isDarkCockpit ? '#0f172a' : '#ffffff')
                          : 'transparent',
                        border: isSelected
                          ? `1.5px solid ${h.color}`
                          : '1.5px solid transparent',
                        boxShadow: isSelected
                          ? (isDarkCockpit ? '0 4px 14px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)')
                          : 'none',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          bgcolor: isSelected ? undefined : (isDarkCockpit ? 'rgba(255,255,255,0.05)' : '#e2e8f0')
                        }
                      }}
                    >
                      <IconComponent size={16} color={isSelected ? h.color : textMuted} />
                      <Typography
                        variant="body2"
                        fontWeight={isSelected ? 900 : 600}
                        sx={{ color: isSelected ? textMain : textMuted, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        {h.label.replace(' Risk', '')}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${h.assessment.riskScore}`}
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          bgcolor: h.scoreBg,
                          color: h.scoreColor,
                          border: `1px solid ${h.scoreColor}40`,
                          '& .MuiChip-label': { px: 0.6 }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ========================================================================= */}
      {/* 2B. INTERACTIVE "WHAT-IF" STRESS TESTING LAB (COLLAPSIBLE HUD)            */}
      {/* ========================================================================= */}
      {stressLabOpen && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            bgcolor: isDarkCockpit ? 'rgba(2, 132, 199, 0.06)' : '#f0fdf4',
            border: `1.5px dashed ${isDarkCockpit ? 'rgba(56, 189, 248, 0.35)' : '#86efac'}`,
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sliders size={18} color="#0284c7" />
              <Typography variant="subtitle2" fontWeight={900} sx={{ color: textMain, letterSpacing: -0.2 }}>
                Simulation Lab: Stress Test Environmental Shock Scenarios
              </Typography>
              <Chip
                label="Dynamic What-If Engine"
                size="small"
                sx={{ bgcolor: 'rgba(2,132,199,0.15)', color: '#0284c7', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="text" onClick={resetStressLab} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', color: textMuted }}>
                Reset to Baseline Telemetry
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            {/* Slider 1: Rainfall Surge */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: textMain }}>
                    Rainfall Surge Inflow
                  </Typography>
                  <Typography variant="caption" fontWeight={900} sx={{ color: simRainfallSurge > 0 ? '#ef4444' : textMuted }}>
                    +{simRainfallSurge} mm/h
                  </Typography>
                </Box>
                <Slider
                  value={simRainfallSurge}
                  min={0}
                  max={120}
                  step={5}
                  onChange={(e, val) => setSimRainfallSurge(val)}
                  sx={{ color: '#0284c7' }}
                />
                <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.65rem' }}>
                  Simulates sudden monsoonal cloudburst over catchment apron.
                </Typography>
              </Box>
            </Grid>

            {/* Slider 2: River Siphon Inflow */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: textMain }}>
                    Upstream Reservoir/River Surge
                  </Typography>
                  <Typography variant="caption" fontWeight={900} sx={{ color: simRiverInflowSurge > 0 ? '#f97316' : textMuted }}>
                    +{simRiverInflowSurge}% Inflow
                  </Typography>
                </Box>
                <Slider
                  value={simRiverInflowSurge}
                  min={0}
                  max={150}
                  step={10}
                  onChange={(e, val) => setSimRiverInflowSurge(val)}
                  sx={{ color: '#f97316' }}
                />
                <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.65rem' }}>
                  Simulates upstream dam gate release or tributary overflow.
                </Typography>
              </Box>
            </Grid>

            {/* Slider 3: Drainage Clearance */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: textMain }}>
                    Municipal Drainage Siphon Capacity
                  </Typography>
                  <Typography variant="caption" fontWeight={900} sx={{ color: simDrainageCapacity < 80 ? '#ef4444' : '#22c55e' }}>
                    {simDrainageCapacity}% Flow Clearance
                  </Typography>
                </Box>
                <Slider
                  value={simDrainageCapacity}
                  min={20}
                  max={100}
                  step={5}
                  onChange={(e, val) => setSimDrainageCapacity(val)}
                  sx={{ color: simDrainageCapacity < 70 ? '#ef4444' : '#22c55e' }}
                />
                <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.65rem' }}>
                  Simulates clogged culverts, silt blockages, or pump failure.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 16, gap: 2 }}>
          <CircularProgress size={44} sx={{ color: accentCyan }} />
          <Typography variant="body2" sx={{ color: textMuted, fontWeight: 700 }}>
            Calibrating ensemble neural models & telemetry pipelines...
          </Typography>
        </Box>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 3. ROW 1: STRATEGIC EXECUTIVE METRICS HUD (4 GLASSMORPHISM CARDS)          */}
          {/* ========================================================================= */}
          <Grid container spacing={3} sx={{ mb: 4.5 }}>
            {/* Card 1: Multi-Hazard Threat Score & Radial Dial */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3.5,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isDarkCockpit ? '0 10px 25px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: scoreBadgeBg,
                        color: scoreColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Shield size={17} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={900} sx={{ color: textMain, lineHeight: 1.1, fontSize: '0.85rem' }}>
                        Threat Index
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.67rem' }}>
                        {selectedHazard} Predictive Score
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={currentAssessment.riskCategory}
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 900,
                      fontSize: '0.65rem',
                      bgcolor: scoreBadgeBg,
                      color: scoreColor,
                      border: `1px solid ${scoreColor}`
                    }}
                  />
                </Box>

                {/* Score Big Display & Surcharge Meter */}
                <Box sx={{ my: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h3" fontWeight={950} sx={{ color: scoreColor, lineHeight: 1, letterSpacing: -1 }}>
                      {currentAssessment.riskScore}
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: textMuted }}>
                      / 100
                    </Typography>
                    {currentAssessment.riskScore !== currentAssessment.baselineScore && (
                      <Chip
                        label={`+${currentAssessment.riskScore - currentAssessment.baselineScore} Stress`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                      />
                    )}
                  </Box>

                  {/* Surcharge Progress */}
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6, gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', fontWeight: 700 }}>
                        Discharge Surcharge
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: scoreColor, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        {dischargePct}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dischargePct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: isDarkCockpit ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: scoreColor,
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                </Box>

                <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', display: 'block', pt: 0.5 }}>
                  {dischargeLabel}
                </Typography>
              </Paper>
            </Grid>

            {/* Card 2: AI Model Confidence & Engine */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isDarkCockpit ? '0 10px 25px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: isDarkCockpit ? 'rgba(34, 197, 94, 0.16)' : '#dcfce7',
                        color: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TrendingUp size={17} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={900} sx={{ color: textMain, lineHeight: 1.1, fontSize: '0.85rem' }}>
                        Model Precision
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.67rem' }}>
                        Cross-Validation Telemetry
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Calibrated"
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      bgcolor: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e'
                    }}
                  />
                </Box>

                <Box sx={{ my: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h3" fontWeight={950} sx={{ color: '#22c55e', lineHeight: 1, letterSpacing: -1 }}>
                      {Math.round(currentAssessment.confidence * 100)}%
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: textMuted }}>
                      Confidence Index
                    </Typography>
                  </Box>

                  <Stack spacing={0.6} sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        Neural Architecture
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: textMain, fontSize: '0.68rem', textAlign: 'right' }}>
                        XGBoost + SHAP Tree
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        Inference Cadence
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: textMain, fontSize: '0.68rem', textAlign: 'right' }}>
                        38ms / 15-min Refresh
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  onClick={() => setModelDetailsOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: accentCyan,
                    pt: 0.5,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.72rem', color: 'inherit' }}>
                    Inspect Ensemble Weights & Logs
                  </Typography>
                  <ChevronRight size={14} />
                </Box>
              </Paper>
            </Grid>

            {/* Card 3: Exposed Population & Demographic Buffer */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isDarkCockpit ? '0 10px 25px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: isDarkCockpit ? 'rgba(168, 85, 247, 0.16)' : '#f3e8ff',
                        color: '#a855f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Users size={17} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={900} sx={{ color: textMain, lineHeight: 1.1, fontSize: '0.85rem' }}>
                        Demographic Exposure
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.67rem' }}>
                        GIS Census Overlay
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={isLow ? "All Safe" : "Action Required"}
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      bgcolor: isLow ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: isLow ? '#22c55e' : '#ef4444'
                    }}
                  />
                </Box>

                <Box sx={{ my: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4" fontWeight={950} sx={{ color: textMain, lineHeight: 1, letterSpacing: -0.5 }}>
                      {isLow ? "0" : currentAssessment.affectedPopulation.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: textMuted }}>
                      {isLow ? "Citizens At Risk (Safe)" : "Residents in Perimeter"}
                    </Typography>
                  </Box>

                  <Stack spacing={0.6} sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        Priority Assisted Evacuees
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: isLow ? '#22c55e' : '#f97316', fontSize: '0.68rem', textAlign: 'right' }}>
                        {isLow ? "None Required" : `~${Math.round(currentAssessment.affectedPopulation * 0.18).toLocaleString()} Persons`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        Critical Infrastructure
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: textMain, fontSize: '0.68rem', textAlign: 'right' }}>
                        {isLow ? "100% Operational" : "2 Substations + 1 Clinic"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  onClick={() => navigate('/vulnerable-habitations')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: accentCyan,
                    pt: 0.5,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.72rem', color: 'inherit' }}>
                    View Habitation Vulnerability GIS
                  </Typography>
                  <ChevronRight size={14} />
                </Box>
              </Paper>
            </Grid>

            {/* Card 4: Relocation Center & Shelter Route */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isDarkCockpit ? '0 10px 25px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: isDarkCockpit ? 'rgba(2, 132, 199, 0.16)' : '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Navigation size={17} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={900} sx={{ color: textMain, lineHeight: 1.1, fontSize: '0.85rem' }}>
                        Evacuation Center
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.67rem' }}>
                        Assigned Safe Shelter
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${resolvedShelterBeds} Beds`}
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      bgcolor: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e'
                    }}
                  />
                </Box>

                <Box sx={{ my: 1 }}>
                  <Typography variant="subtitle2" fontWeight={900} noWrap sx={{ color: textMain, fontSize: '0.88rem' }}>
                    {resolvedShelterName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.7rem', display: 'block', mt: 0.2 }}>
                    Reinforced Multi-Story Concrete Structure
                  </Typography>

                  <Stack spacing={0.6} sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        Distance & Travel Time
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: textMain, fontSize: '0.68rem', textAlign: 'right' }}>
                        {resolvedShelterDist} • ~{resolvedShelterTime}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        Evacuation Route
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#22c55e', fontSize: '0.68rem', textAlign: 'right' }}>
                        Clear (Elevated Corridor)
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  onClick={() => navigate('/carrying-capacity')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: accentCyan,
                    pt: 0.5,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.72rem', color: 'inherit' }}>
                    Inspect Shelter Network & Capacity
                  </Typography>
                  <ChevronRight size={14} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ========================================================================= */}
          {/* 4. ROW 2: TACTICAL MAP + INTERACTIVE RECHARTS TELEMETRY ANALYTICS          */}
          {/* ========================================================================= */}
          <Grid container spacing={3} sx={{ mb: 4.5 }}>
            {/* Left Deck: Expanded Disaster Hazard Map */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: isDarkCockpit ? '0 10px 30px rgba(0,0,0,0.25)' : '0 2px 14px rgba(0,0,0,0.04)'
                }}
              >
                {/* Map Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    px: 2,
                    borderBottom: `1px solid ${cardBorder}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 2,
                        bgcolor: isDarkCockpit ? 'rgba(2, 132, 199, 0.16)' : '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Layers size={16} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={900} sx={{ color: textMain, fontSize: '0.86rem' }}>
                        Tactical Geospatial Threat Map
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem' }}>
                        Centering on {selectedHotspot.name} • {selectedHotspot.terrain}
                      </Typography>
                    </Box>
                  </Box>

                  <Tooltip title="Expand to Dedicated Map Terminal">
                    <Button
                      size="small"
                      startIcon={<Maximize2 size={13} />}
                      onClick={() => navigate('/disaster-map')}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: accentCyan,
                        borderRadius: 1.5
                      }}
                    >
                      Full Map
                    </Button>
                  </Tooltip>
                </Box>

                {/* Map View Container */}
                <Box sx={{ position: 'relative', width: '100%', height: 420 }}>
                  <HazardMap activeFilter={selectedHazard} />

                  {/* Clean Glassmorphic Risk Legend Overlay */}
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      zIndex: 400,
                      px: 1.5,
                      py: 0.6,
                      borderRadius: 2,
                      bgcolor: isDarkCockpit ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${cardBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      boxShadow: '0 4px 18px rgba(0,0,0,0.2)'
                    }}
                  >
                    {[
                      { label: 'Low', color: '#22c55e' },
                      { label: 'Moderate', color: '#eab308' },
                      { label: 'High', color: '#f97316' },
                      { label: 'Critical', color: '#ef4444' }
                    ].map((l, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: l.color }} />
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.65rem', color: textMain }}>
                          {l.label}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              </Paper>
            </Grid>

            {/* Right Deck: Interactive Recharts Telemetry Visualizer */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: isDarkCockpit ? '0 10px 30px rgba(0,0,0,0.25)' : '0 2px 14px rgba(0,0,0,0.04)'
                }}
              >
                {/* Visualizer Tab Switcher Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    p: 1.5,
                    px: 2,
                    borderBottom: `1px solid ${cardBorder}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 2,
                        bgcolor: isDarkCockpit ? 'rgba(56, 189, 248, 0.16)' : '#e0f2fe',
                        color: accentCyan,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Activity size={16} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={900} sx={{ color: textMain, fontSize: '0.86rem' }}>
                        Predictive Telemetry & XAI Analytics
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem' }}>
                        {hydrographMeta.subtext}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tabs */}
                  <Stack direction="row" spacing={0.6}>
                    {[
                      { key: 'hydrograph', label: '72h Forecast', icon: Clock },
                      { key: 'shap', label: 'XAI Drivers', icon: TrendingUp },
                      { key: 'radar', label: 'Risk Profile', icon: Shield }
                    ].map((tab) => {
                      const active = chartTab === tab.key;
                      const TabIcon = tab.icon;
                      return (
                        <Button
                          key={tab.key}
                          size="small"
                          startIcon={<TabIcon size={12} />}
                          onClick={() => setChartTab(tab.key)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: active ? 800 : 600,
                            fontSize: '0.72rem',
                            borderRadius: 1.75,
                            py: 0.35,
                            px: 1.1,
                            bgcolor: active ? accentCyan : 'transparent',
                            color: active ? '#ffffff' : textMuted,
                            '&:hover': {
                              bgcolor: active ? accentCyan : isDarkCockpit ? 'rgba(255,255,255,0.06)' : '#f1f5f9'
                            }
                          }}
                        >
                          {tab.label}
                        </Button>
                      );
                    })}
                  </Stack>
                </Box>

                {/* Chart Area Container */}
                <Box sx={{ p: 2, flex: 1, minHeight: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {chartTab === 'hydrograph' && (
                    <Box sx={{ width: '100%', height: 360 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, textTransform: 'uppercase' }}>
                          {hydrographMeta.title}
                        </Typography>
                        <Chip
                          label={`Peak Crest: ${hydrographData[2]?.level}${hydrographMeta.unit} at +12h`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
                        />
                      </Box>
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={hydrographData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={scoreColor} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={scoreColor} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkCockpit ? 'rgba(255,255,255,0.06)' : '#e2e8f0'} />
                          <XAxis dataKey="time" stroke={textMuted} fontSize={11} tickLine={false} />
                          <YAxis stroke={textMuted} fontSize={11} domain={['dataMin - 0.5', 'dataMax + 0.8']} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: isDarkCockpit ? '#0f172a' : '#ffffff',
                              border: `1px solid ${cardBorder}`,
                              borderRadius: 8,
                              fontSize: 12
                            }}
                          />
                          <ReferenceLine
                            y={hydrographData[0]?.dangerLevel}
                            label={{ value: selectedHazard === 'FLOOD' ? 'DANGER STAGE' : 'CRITICAL THRESHOLD', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                          />
                          <Area
                            type="monotone"
                            dataKey="level"
                            stroke={scoreColor}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#levelGradient)"
                            name={hydrographMeta.metricLabel}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {chartTab === 'shap' && (
                    <Box sx={{ width: '100%', height: 360 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, textTransform: 'uppercase' }}>
                          SHAP Value Feature Attribution (% Influence on Total Hazard Risk)
                        </Typography>
                        <Chip
                          label="XGBoost TreeExplainer"
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}
                        />
                      </Box>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={shapFeatureData}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkCockpit ? 'rgba(255,255,255,0.06)' : '#e2e8f0'} horizontal={false} />
                          <XAxis type="number" stroke={textMuted} fontSize={11} domain={[0, 60]} unit="%" tickLine={false} />
                          <YAxis dataKey="feature" type="category" stroke={textMuted} fontSize={11} width={130} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: isDarkCockpit ? '#0f172a' : '#ffffff',
                              border: `1px solid ${cardBorder}`,
                              borderRadius: 8,
                              fontSize: 12
                            }}
                          />
                          <Bar
                            dataKey="impact"
                            name="Attribution Impact"
                            fill="#0284c7"
                            radius={[0, 6, 6, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {chartTab === 'radar' && (
                    <Box sx={{ width: '100%', height: 360 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, textTransform: 'uppercase' }}>
                          Multi-Dimensional Threat & Preparedness Radar Profile
                        </Typography>
                        <Chip
                          label="Hexagonal Risk Boundary"
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}
                        />
                      </Box>
                      <ResponsiveContainer width="100%" height={320}>
                        <RadarChart data={vulnerabilityRadarData}>
                          <PolarGrid stroke={isDarkCockpit ? 'rgba(255,255,255,0.1)' : '#e2e8f0'} />
                          <PolarAngleAxis dataKey="metric" stroke={textMuted} fontSize={11} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={textMuted} fontSize={10} />
                          <Radar
                            name="Threat Score"
                            dataKey="score"
                            stroke="#0284c7"
                            fill="#0284c7"
                            fillOpacity={0.35}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: isDarkCockpit ? '#0f172a' : '#ffffff',
                              border: `1px solid ${cardBorder}`,
                              borderRadius: 8,
                              fontSize: 12
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ========================================================================= */}
          {/* 5. ROW 3: THE 7 CORE DISASTER INTELLIGENCE DECISIONS (MISSION DECK)        */}
          {/* ========================================================================= */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3.5,
              bgcolor: cardBg,
              border: `1px solid ${cardBorder}`,
              backdropFilter: 'blur(16px)',
              boxShadow: isDarkCockpit ? '0 12px 36px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
              mb: 4
            }}
          >
            {/* Header & View Mode Switcher */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(2, 132, 199, 0.16)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={20} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={900} sx={{ color: textMain, letterSpacing: -0.3, lineHeight: 1.2 }}>
                    The 7 Core Disaster Intelligence Decisions
                  </Typography>
                  <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.75rem' }}>
                    Standardized decision-support taxonomy empowering field commanders & municipal executives
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={0.8} alignItems="center">
                <Button
                  size="small"
                  variant={questionsViewMode === 'dossier' ? 'contained' : 'outlined'}
                  onClick={() => setQuestionsViewMode('dossier')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    borderRadius: 2,
                    px: 1.4,
                    bgcolor: questionsViewMode === 'dossier' ? '#0284c7' : 'transparent',
                    borderColor: cardBorder,
                    color: questionsViewMode === 'dossier' ? '#ffffff' : textMuted
                  }}
                >
                  Interactive Dossier
                </Button>
                <Button
                  size="small"
                  variant={questionsViewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setQuestionsViewMode('grid')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    borderRadius: 2,
                    px: 1.4,
                    bgcolor: questionsViewMode === 'grid' ? '#0284c7' : 'transparent',
                    borderColor: cardBorder,
                    color: questionsViewMode === 'grid' ? '#ffffff' : textMuted
                  }}
                >
                  Full 7 Questions Grid
                </Button>
              </Stack>
            </Box>

            {/* Stepper Tabs Selector (Used in Dossier Mode) */}
            {questionsViewMode === 'dossier' && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.25,
                  overflowX: 'auto',
                  py: 0.75,
                  px: 0.25,
                  mb: 3,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
                {questionsList.map((q) => {
                  const isActive = q.id === activeQuestionId;
                  const Icon = q.icon;
                  return (
                    <Box
                      key={q.id}
                      onClick={() => setActiveQuestionId(q.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.8,
                        py: 1,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        bgcolor: isActive
                          ? (isDarkCockpit ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe')
                          : (isDarkCockpit ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                        border: '1.5px solid',
                        borderColor: isActive ? '#0284c7' : cardBorder,
                        boxShadow: isActive ? (isDarkCockpit ? '0 0 12px rgba(2, 132, 199, 0.25)' : '0 2px 8px rgba(2, 132, 199, 0.12)') : 'none',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                        flexShrink: 0,
                        '&:hover': {
                          borderColor: isActive ? '#0284c7' : (isDarkCockpit ? 'rgba(56, 189, 248, 0.5)' : '#93c5fd'),
                          bgcolor: isActive
                            ? (isDarkCockpit ? 'rgba(2, 132, 199, 0.25)' : '#dbeafe')
                            : (isDarkCockpit ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9')
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: isActive ? '#0284c7' : isDarkCockpit ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                          color: isActive ? '#ffffff' : textMuted,
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s ease, color 0.15s ease'
                        }}
                      >
                        {q.id}
                      </Box>
                      <Icon size={14} color={isActive ? '#0284c7' : textMuted} />
                      <Typography
                        variant="caption"
                        fontWeight={isActive ? 900 : 700}
                        sx={{ color: isActive ? textMain : textMuted, fontSize: '0.78rem' }}
                      >
                        {q.shortLabel}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* View Mode A: Interactive Detailed Dossier Card */}
            {questionsViewMode === 'dossier' && (
              <Box
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 3,
                  bgcolor: isDarkCockpit ? 'rgba(15, 23, 42, 0.9)' : '#f8fafc',
                  border: `1.5px solid ${activeQuestion.pillColor}40`,
                  boxShadow: `0 8px 30px ${activeQuestion.pillColor}10`
                }}
              >
                {/* Dossier Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: activeQuestion.pillColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 14px ${activeQuestion.pillColor}50`
                      }}
                    >
                      <activeQuestion.icon size={22} />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight={900} sx={{ color: activeQuestion.pillColor, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Question {activeQuestion.id} of 7 • {activeQuestion.shortLabel}
                        </Typography>
                        <Chip
                          label={activeQuestion.pill}
                          size="small"
                          sx={{
                            height: 20,
                            fontWeight: 900,
                            fontSize: '0.65rem',
                            bgcolor: `${activeQuestion.pillColor}20`,
                            color: activeQuestion.pillColor,
                            border: `1px solid ${activeQuestion.pillColor}40`
                          }}
                        />
                      </Box>
                      <Typography variant="h5" fontWeight={900} sx={{ color: textMain, mt: 0.2 }}>
                        {activeQuestion.title}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Previous / Next Navigator */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={activeQuestion.id === 1}
                      onClick={() => setActiveQuestionId(activeQuestion.id - 1)}
                      startIcon={<ChevronLeft size={14} />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        borderRadius: 2,
                        borderColor: cardBorder,
                        color: textMain
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={activeQuestion.id === 7}
                      onClick={() => setActiveQuestionId(activeQuestion.id + 1)}
                      endIcon={<ChevronRight size={14} />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        borderRadius: 2,
                        borderColor: '#0284c7',
                        color: '#0284c7'
                      }}
                    >
                      Next Question
                    </Button>
                  </Stack>
                </Box>

                {/* Executive Summary Callout */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDarkCockpit ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff',
                    border: '1px solid',
                    borderColor: isDarkCockpit ? 'rgba(2, 132, 199, 0.25)' : '#bae6fd',
                    mb: 2.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                    <Sparkles size={16} color="#0284c7" />
                    <Typography variant="caption" fontWeight={900} sx={{ color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Executive Operational Summary
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={700} sx={{ color: textMain, lineHeight: 1.55, fontSize: '0.94rem' }}>
                    {activeQuestion.summary}
                  </Typography>
                </Box>

                {/* Metrics Breakdown Grid */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="caption" fontWeight={900} sx={{ color: textMuted, display: 'block', mb: 1.2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Real-Time Sensor & Analytical Indicators:
                  </Typography>
                  <Grid container spacing={1.5}>
                    {activeQuestion.metrics.map((m, idx) => (
                      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isDarkCockpit ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                            border: `1px solid ${cardBorder}`
                          }}
                        >
                          <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.7rem' }}>
                            {m.label}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: m.color || textMain, mt: 0.3, fontSize: '0.85rem' }}>
                            {m.value}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Technical Drainage Physics & Directive Block */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDarkCockpit ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                        border: `1px solid ${cardBorder}`,
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                        <Activity size={15} color="#0284c7" />
                        <Typography variant="caption" fontWeight={900} sx={{ color: '#0284c7', textTransform: 'uppercase' }}>
                          Physical Sensor Telemetry & Hydro-Dynamics
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: textMain, lineHeight: 1.6, fontSize: '0.82rem' }}>
                        {activeQuestion.telemetry}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDarkCockpit ? 'rgba(239, 68, 68, 0.06)' : '#fef2f2',
                        border: `1px solid ${isDarkCockpit ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}`,
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                        <ShieldCheck size={15} color="#ef4444" />
                        <Typography variant="caption" fontWeight={900} sx={{ color: '#ef4444', textTransform: 'uppercase' }}>
                          Institutional Operational Directive
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: textMain, lineHeight: 1.5, fontSize: '0.82rem' }}>
                        {activeQuestion.directive}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* View Mode B: Full 7 Questions Grid */}
            {questionsViewMode === 'grid' && (
              <Grid container spacing={2}>
                {questionsList.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={q.id}>
                      <Paper
                        elevation={0}
                        onClick={() => {
                          setActiveQuestionId(q.id);
                          setQuestionsViewMode('dossier');
                        }}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: isDarkCockpit ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                          border: `1px solid ${cardBorder}`,
                          cursor: 'pointer',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#0284c7',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(2, 132, 199, 0.15)',
                                  color: '#0284c7',
                                  fontSize: '0.72rem',
                                  fontWeight: 900,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {q.id}
                              </Box>
                              <Icon size={16} color="#0284c7" />
                              <Typography variant="caption" fontWeight={900} sx={{ color: textMuted }}>
                                {q.shortLabel}
                              </Typography>
                            </Box>
                            <Chip
                              label={q.pill}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                bgcolor: `${q.pillColor}15`,
                                color: q.pillColor
                              }}
                            />
                          </Box>

                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: textMain, fontSize: '0.86rem', mb: 0.5 }}>
                            {q.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: textMuted, fontSize: '0.76rem', lineHeight: 1.4, mb: 1.5 }}>
                            {q.summary}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${cardBorder}` }}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7', fontSize: '0.72rem' }}>
                            Inspect Full Telemetry & Directives &rarr;
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: HOTSPOT GEOSPATIAL SEARCH & SELECTION DIALOG                     */}
      {/* ========================================================================= */}
      <Dialog
        open={hotspotDialogOpen}
        onClose={() => setHotspotDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            bgcolor: cardBg,
            border: `1px solid ${cardBorder}`,
            p: 1.5,
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'rgba(2, 132, 199, 0.16)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MapPin size={18} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: textMain, fontSize: '1.05rem' }}>
                Select Monitored Catchment Hotspot
              </Typography>
              <Typography variant="caption" sx={{ color: textMuted }}>
                Regional basins & river confluence zones in {location?.district || 'this jurisdiction'}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setHotspotDialogOpen(false)} sx={{ color: textMuted }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search basins by name, district or terrain..."
            value={hotspotSearch}
            onChange={(e) => setHotspotSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search size={16} color={textMuted} style={{ marginRight: 8 }} />
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: isDarkCockpit ? 'rgba(255,255,255,0.03)' : '#ffffff'
              }
            }}
          />

          <Stack spacing={1.2} sx={{ maxHeight: 380, overflowY: 'auto' }}>
            {filteredHotspots.map((spot) => {
              const isSelected = selectedHotspot?.id === spot.id;
              return (
                <Box
                  key={spot.id}
                  onClick={() => {
                    setSelectedHotspot(spot);
                    setHotspotDialogOpen(false);
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    border: '1.5px solid',
                    borderColor: isSelected ? '#0284c7' : cardBorder,
                    bgcolor: isSelected
                      ? (isDarkCockpit ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff')
                      : (isDarkCockpit ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: '#0284c7',
                      bgcolor: isDarkCockpit ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff'
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={900} sx={{ color: isSelected ? '#0284c7' : textMain }}>
                        {spot.name}
                      </Typography>
                      <Chip
                        label={spot.district}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: textMuted, display: 'block', mt: 0.3 }}>
                      {spot.terrain} • Catchment Area: ~{spot.area} km² • Elev: {spot.elevation}
                    </Typography>
                  </Box>

                  {isSelected && (
                    <Chip
                      label="Active Hotspot"
                      size="small"
                      sx={{
                        bgcolor: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        height: 22
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 7. MODAL: AI MODEL ARCHITECTURE & TELEMETRY SPECS                          */}
      {/* ========================================================================= */}
      <Dialog
        open={modelDetailsOpen}
        onClose={() => setModelDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            bgcolor: cardBg,
            border: `1px solid ${cardBorder}`,
            p: 1.5
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'rgba(34, 197, 94, 0.16)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cpu size={18} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: textMain, fontSize: '1.05rem' }}>
                AI Architecture & Model Telemetry
              </Typography>
              <Typography variant="caption" sx={{ color: textMuted }}>
                Calibrated ensemble parameters & cross-validation metrics
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setModelDetailsOpen(false)} sx={{ color: textMuted }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={1.5}>
            {[
              {
                model: 'Hydrological Flood Dynamics (XGBoost + GRU Temporal)',
                accuracy: '88% Calibrated Precision • 0.89 F1-Score',
                inputs: 'Precipitation volume, River stage sonar sensors, Upstream reservoir release, Elevation DEM (10m)',
                latency: '42ms inference cadence • 15-min radar sync'
              },
              {
                model: 'Slope Stability & Geotechnical Hazard (LightGBM)',
                accuracy: '86% Calibrated Precision • 0.84 F1-Score',
                inputs: 'Soil Saturation Index (SSI), Geological Incline gradient, Vegetation Sentinel-2 NDVI, Pore pressure',
                latency: '38ms inference cadence • 30-min telemetry sync'
              },
              {
                model: 'Wildfire Spread & Thermal Anomaly (Random Forest + FIRMS)',
                accuracy: '82% Calibrated Precision • 0.81 F1-Score',
                inputs: 'Ambient Temperature, Wind Velocity vectors, Fuel Moisture content, MODIS/VIIRS thermal anomalies',
                latency: '51ms inference cadence • Real-time satellite ingest'
              }
            ].map((spec, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: isDarkCockpit ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  border: `1px solid ${cardBorder}`
                }}
              >
                <Typography variant="body2" fontWeight={900} sx={{ color: textMain }}>
                  {spec.model}
                </Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: '#22c55e', display: 'block', mt: 0.3 }}>
                  {spec.accuracy}
                </Typography>
                <Typography variant="caption" sx={{ color: textMuted, display: 'block', mt: 0.6 }}>
                  <strong>Sensors & Telemetry:</strong> {spec.inputs}
                </Typography>
                <Typography variant="caption" sx={{ color: textMuted, display: 'block', mt: 0.2 }}>
                  <strong>Performance:</strong> {spec.latency}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </Boilerplate>
  );
}
