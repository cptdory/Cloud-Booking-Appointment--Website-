// stores/sidebar-store.ts
import { create } from 'zustand';
import { Building, Calendar, Users, Info, ListCheck, BedDouble, BriefcaseBusiness, ContactRound } from 'lucide-react';

interface UserData {
  role: "global-admin" | "admin" | "customer";
  name: string;
  email: string;
  staffCode?: string;
  customerNo?: string;
  currentBookingSetup?: {
    code: string;
    parameterId: number;
    parameterValueId: number;
  };
}

interface Team {
  name: string;
  logo: any;
  plan: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

interface SidebarState {
  userData: UserData | null;
  teams: Team[];
  activeTeam: Team | null;
  staticNav: NavItem[];
  dynamicNav: NavItem[];
  dynamicNavCache: Record<string, NavItem[]>;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  setActiveTeam: (team: Team) => void;
  loadDynamicNav: (teamCode: string) => Promise<void>;
}

// Module-level flag - survives component re-renders
let initPromise: Promise<void> | null = null;

export const useSidebarStore = create<SidebarState>()(
  (set, get) => ({
    userData: null,
    teams: [],
    activeTeam: null,
    staticNav: [],
    dynamicNav: [],
    dynamicNavCache: {},
    loading: true,
    initialized: false,

    initialize: async () => {
      // If already initialized, skip immediately
      if (get().initialized) {
        console.log('[Store] Already initialized, skipping');
        return;
      }

      // If initialization is in progress, wait for it
      if (initPromise) {
        console.log('[Store] Initialization in progress, waiting...');
        return initPromise;
      }

      console.log('[Store] Starting initialization...');

      // Create and store the promise
      initPromise = (async () => {
        try {
          const userRes = await fetch("/api/auth/me");
          const userDataRes = await userRes.json();

          if (!userDataRes.authenticated || !userDataRes.user) {
            set({ loading: false, initialized: true });
            return;
          }

          const user = userDataRes.user;
          const userData: UserData = {
            role: user.role,
            name: user.name,
            email: user.email,
            staffCode: user.staffCode,
            customerNo: user.customerNo,
            currentBookingSetup: user.currentBookingSetup,
          };

          // Customer role - minimal setup
          if (user.role === "customer") {
            set({
              userData,
              staticNav: [{ title: "Appointment", url: "/booking", icon: ListCheck }],
              loading: false,
              initialized: true,
            });
            return;
          }

          // Both global-admin and admin continue with admin initialization
          const teamsRes = await fetch("/api/booking-setup/get-booking-setup-list");
          const teamsJson = await teamsRes.json();
          const setups = typeof teamsJson.value === "string" 
            ? JSON.parse(teamsJson.value) 
            : teamsJson.value;

          const teams: Team[] = setups.map((s: any) => ({
            name: s.Code,
            logo: Building,
            plan: s.Description,
          }));

          const staticNav: NavItem[] = [
            { title: "Calendar", url: "/calendar", icon: Calendar },
            { title: "Appointment", url: "/booking", icon: ListCheck },
            { title: "Customer", url: "/customers", icon: Users },
            { title: "Business Information", url: "/business-information", icon: Info },
          ];

          // Determine initial active team
          let activeTeam: Team | null = null;
          
          if (user.role === "admin") {
            const assignedTeamCode = user.currentBookingSetup?.code;
            if (assignedTeamCode) {
              activeTeam = teams.find((t) => t.name === assignedTeamCode) || null;
            }
          } else if (user.role === "global-admin") {
            const hasContext = user.currentBookingSetup?.code && user.currentBookingSetup?.parameterId !== 0;
            activeTeam = hasContext
              ? teams.find((t) => t.name === user.currentBookingSetup.code) || null
              : teams[0] || null;
          }

          set({ 
            userData, 
            teams, 
            staticNav, 
            activeTeam, 
            loading: false, 
            initialized: true,
          });

          // Load dynamic nav for active team
          if (activeTeam) {
            await get().loadDynamicNav(activeTeam.name);
          }

          console.log('[Store] Initialization complete, activeTeam:', activeTeam?.name);
        } catch (error) {
          console.error("[Store] Failed to initialize:", error);
          set({ loading: false, initialized: true });
        }
      })();

      return initPromise;
    },

    setActiveTeam: (team) => {
      const current = get().activeTeam;
      if (current?.name === team.name) {
        console.log('[Store] Same team selected, skipping');
        return;
      }
      console.log('[Store] Setting active team:', team.name);
      set({ activeTeam: team });
      get().loadDynamicNav(team.name);
    },

    loadDynamicNav: async (teamCode) => {
      const { dynamicNavCache } = get();

      if (dynamicNavCache[teamCode]) {
        console.log('[Store] Using cached nav for:', teamCode);
        set({ dynamicNav: dynamicNavCache[teamCode] });
        return;
      }

      console.log('[Store] Fetching nav for:', teamCode);

      try {
        const res = await fetch(`/api/booking-setup/get-booking-setup?code=${teamCode}`);
        const json = await res.json();

        if (!json.value?.length) return;

        const setupData = json.value[0];
        const params = setupData.BookingParameter || [];

        const parameterNav: NavItem[] = params.map((p: any) => {
          const lower = p.BookingParameterCode.toLowerCase();
          let icon = Info;
          
          if (lower.includes("staff")) icon = ContactRound;
          else if (lower.includes("bed")) icon = BedDouble;
          else if (lower.includes("service")) icon = BriefcaseBusiness;

          let url = "";
          if (p.BookingParameterStaff) {
            url = `/staff?code=${teamCode}&parameter_id=${p.BookingParameterId}`;
          } else if (p.BookingParameterService) {
            url = `/services?code=${teamCode}&parameter_id=${p.BookingParameterId}`;
          } else {
            url = `/parameter?code=${teamCode}&parameter_id=${p.BookingParameterId}`;
          }

          return {
            title: p.BookingParameterCode,
            url,
            icon,
          };
        });

        set({ 
          dynamicNav: parameterNav, 
          dynamicNavCache: { ...dynamicNavCache, [teamCode]: parameterNav }
        });
      } catch (error) {
        console.error("[Store] Failed to load dynamic nav:", error);
      }
    },
  })
);