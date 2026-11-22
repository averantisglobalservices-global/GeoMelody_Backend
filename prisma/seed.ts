import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

// ============================================================
// PERMISSIONS
// ============================================================

const permissions = [
  // ----------------------------------------------------------
  // ADMIN USERS
  // ----------------------------------------------------------

  {
    code: 'USER_VIEW',
    name: 'View Users',
    description: 'View user accounts',
  },
  {
    code: 'USER_CREATE',
    name: 'Create Users',
    description: 'Create user accounts',
  },
  {
    code: 'USER_UPDATE',
    name: 'Update Users',
    description: 'Update user accounts',
  },
  {
    code: 'USER_DELETE',
    name: 'Delete Users',
    description: 'Soft delete user accounts',
  },
  {
    code: 'USER_STATUS_UPDATE',
    name: 'Update User Status',
    description: 'Activate or deactivate user accounts',
  },
  {
    code: 'USER_ROLE_UPDATE',
    name: 'Update User Roles',
    description: 'Assign roles to users',
  },
  {
    code: 'USER_PASSWORD_RESET',
    name: 'Reset User Password',
    description: 'Reset user passwords',
  },
  {
    code: 'USER_EMAIL_VERIFY',
    name: 'Verify User Email',
    description: 'Verify user email addresses',
  },
  {
    code: 'USER_LOGIN_HISTORY_VIEW',
    name: 'View Login History',
    description: 'View user login history',
  },

  // ----------------------------------------------------------
  // ROLES
  // ----------------------------------------------------------

  {
    code: 'ROLE_VIEW',
    name: 'View Roles',
    description: 'View role list and details',
  },
  {
    code: 'ROLE_CREATE',
    name: 'Create Roles',
    description: 'Create custom roles',
  },
  {
    code: 'ROLE_UPDATE',
    name: 'Update Roles',
    description: 'Edit custom role information',
  },
  {
    code: 'ROLE_STATUS_UPDATE',
    name: 'Update Role Status',
    description: 'Activate or deactivate roles',
  },
  {
    code: 'ROLE_DELETE',
    name: 'Delete Roles',
    description: 'Delete custom roles',
  },
  {
    code: 'ROLE_PERMISSION_UPDATE',
    name: 'Manage Role Permissions',
    description: 'Attach and detach permissions from roles',
  },

  // ----------------------------------------------------------
  // PERMISSIONS
  // ----------------------------------------------------------

  {
    code: 'PERMISSION_VIEW',
    name: 'View Permissions',
    description: 'View permission list and details',
  },
  {
    code: 'PERMISSION_CREATE',
    name: 'Create Permissions',
    description: 'Create custom permissions',
  },
  {
    code: 'PERMISSION_UPDATE',
    name: 'Update Permissions',
    description: 'Update permission information',
  },
  {
    code: 'PERMISSION_STATUS_UPDATE',
    name: 'Update Permission Status',
    description: 'Activate or deactivate permissions',
  },
  {
    code: 'PERMISSION_DELETE',
    name: 'Delete Permissions',
    description: 'Delete custom permissions',
  },

  // ----------------------------------------------------------
  // ARTIST
  // ----------------------------------------------------------

  {
    code: 'ARTIST_VIEW',
    name: 'View Artists',
    description: 'View artist profiles',
  },
  {
    code: 'ARTIST_CREATE',
    name: 'Create Artists',
    description: 'Create artist profiles',
  },
  {
    code: 'ARTIST_UPDATE',
    name: 'Update Artists',
    description: 'Update artist profiles',
  },
  {
    code: 'ARTIST_VERIFY',
    name: 'Verify Artists',
    description: 'Verify artist accounts',
  },
  {
    code: 'ARTIST_DELETE',
    name: 'Delete Artists',
    description: 'Delete artist accounts',
  },

  // ----------------------------------------------------------
  // MUSIC GENRE MASTER
  // ----------------------------------------------------------

  {
    code: 'MUSIC_GENRE_VIEW',
    name: 'View Music Genres',
    description: 'View music genre master data',
  },
  {
    code: 'MUSIC_GENRE_CREATE',
    name: 'Create Music Genres',
    description: 'Create music genre master data',
  },
  {
    code: 'MUSIC_GENRE_UPDATE',
    name: 'Update Music Genres',
    description: 'Update music genre master data',
  },
  {
    code: 'MUSIC_GENRE_DELETE',
    name: 'Delete Music Genres',
    description: 'Soft delete music genre master data',
  },
  {
    code: 'MUSIC_GENRE_STATUS_UPDATE',
    name: 'Update Music Genre Status',
    description: 'Activate or deactivate music genre master data',
  },

  {
    code: 'ARTIST_ROLE_VIEW',
    name: 'View Artist Roles',
    description: 'View artist role master data',
  },
  {
    code: 'ARTIST_ROLE_CREATE',
    name: 'Create Artist Roles',
    description: 'Create artist role master data',
  },
  {
    code: 'ARTIST_ROLE_UPDATE',
    name: 'Update Artist Roles',
    description: 'Update artist role master data',
  },
  {
    code: 'ARTIST_ROLE_DELETE',
    name: 'Delete Artist Roles',
    description: 'Soft delete artist role master data',
  },
  {
    code: 'ARTIST_ROLE_STATUS_UPDATE',
    name: 'Update Artist Role Status',
    description: 'Activate or deactivate artist role master data',
  },

  {
    code: 'INSTRUMENT_VIEW',
    name: 'View Instruments',
    description: 'View instrument master records',
  },

  {
    code: 'INSTRUMENT_CREATE',
    name: 'Create Instrument',
    description: 'Create a new instrument',
  },

  {
    code: 'INSTRUMENT_UPDATE',
    name: 'Update Instrument',
    description: 'Update instrument details and image',
  },

  {
    code: 'INSTRUMENT_STATUS_UPDATE',
    name: 'Update Instrument Status',
    description: 'Activate or deactivate an instrument',
  },

  {
    code: 'INSTRUMENT_DELETE',
    name: 'Delete Instrument',
    description: 'Soft delete an instrument',
  },

  // Subscription Plans
{
  code: 'SUBSCRIPTION_PLAN_VIEW',
  name: 'View Subscription Plans',
  description: 'View subscription plans',
},

{
  code: 'SUBSCRIPTION_PLAN_UPDATE',
  name: 'Update Subscription Plans',
  description: 'Update subscription plans',
},
// {
//   code: 'SUBSCRIPTION_PLAN_DELETE',
//   name: 'Delete Subscription Plans',
//   description: 'Delete subscription plans',
// },
// {
//   code: 'SUBSCRIPTION_PLAN_STATUS_UPDATE',
//   name: 'Update Subscription Plan Status',
//   description: 'Activate or deactivate subscription plans',
// },

  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // MUSIC
  // ----------------------------------------------------------

  {
    code: 'MUSIC_VIEW',
    name: 'View Music',
    description: 'View music catalog',
  },
  {
    code: 'MUSIC_CREATE',
    name: 'Create Music',
    description: 'Create music records',
  },
  {
    code: 'MUSIC_UPDATE',
    name: 'Update Music',
    description: 'Update music records',
  },
  {
    code: 'MUSIC_DELETE',
    name: 'Delete Music',
    description: 'Delete music records',
  },
  {
    code: 'MUSIC_APPROVE',
    name: 'Approve Music',
    description: 'Approve uploaded music',
  },
  {
    code: 'MUSIC_REJECT',
    name: 'Reject Music',
    description: 'Reject uploaded music',
  },

  // ----------------------------------------------------------
  // EVENTS
  // ----------------------------------------------------------

  {
    code: 'EVENT_VIEW',
    name: 'View Events',
    description: 'View events',
  },
  {
    code: 'EVENT_CREATE',
    name: 'Create Events',
    description: 'Create events',
  },
  {
    code: 'EVENT_UPDATE',
    name: 'Update Events',
    description: 'Update events',
  },
  {
    code: 'EVENT_DELETE',
    name: 'Delete Events',
    description: 'Delete events',
  },
  {
    code: 'EVENT_APPROVE',
    name: 'Approve Events',
    description: 'Approve events',
  },
  {
    code: 'EVENT_REJECT',
    name: 'Reject Events',
    description: 'Reject events',
  },

  // ----------------------------------------------------------
  // PAYMENTS
  // ----------------------------------------------------------

  {
    code: 'PAYMENT_VIEW',
    name: 'View Payments',
    description: 'View payment information',
  },
  {
    code: 'PAYMENT_MANAGE',
    name: 'Manage Payments',
    description: 'Manage payment operations and configuration',
  },

  // ----------------------------------------------------------
  // SUBSCRIPTIONS
  // ----------------------------------------------------------

  {
    code: 'SUBSCRIPTION_VIEW',
    name: 'View Subscriptions',
    description: 'View subscriptions',
  },
  {
    code: 'SUBSCRIPTION_MANAGE',
    name: 'Manage Subscriptions',
    description: 'Manage subscriptions',
  },

  // ----------------------------------------------------------
  // REPORTS
  // ----------------------------------------------------------

  {
    code: 'REPORT_VIEW',
    name: 'View Reports',
    description: 'View operational and business reports',
  },
  {
    code: 'REPORT_MANAGE',
    name: 'Manage Reports',
    description: 'Manage operational and business reports',
  },

  // ----------------------------------------------------------
  // AUDIT
  // ----------------------------------------------------------

  {
    code: 'AUDIT_VIEW',
    name: 'View Audit Logs',
    description: 'View administrative and security audit logs',
  },

  // ----------------------------------------------------------
  // SYSTEM CONFIGURATION
  // ----------------------------------------------------------

  {
    code: 'SYSTEM_CONFIG_VIEW',
    name: 'View System Configuration',
    description: 'View platform configuration',
  },
  {
    code: 'SYSTEM_CONFIG_UPDATE',
    name: 'Update System Configuration',
    description: 'Update platform configuration',
  },

  // ----------------------------------------------------------
  // API CONFIGURATION
  // ----------------------------------------------------------

  {
    code: 'API_CONFIG_VIEW',
    name: 'View API Configuration',
    description: 'View API configuration',
  },
  {
    code: 'API_CONFIG_UPDATE',
    name: 'Update API Configuration',
    description: 'Update API configuration',
  },

  // ----------------------------------------------------------
  // SECURITY
  // ----------------------------------------------------------

  {
    code: 'SECURITY_CONFIG_VIEW',
    name: 'View Security Configuration',
    description: 'View security settings',
  },
  {
    code: 'SECURITY_CONFIG_UPDATE',
    name: 'Update Security Configuration',
    description: 'Update security settings',
  },

  // ----------------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------------

  {
    code: 'ANALYTICS_VIEW',
    name: 'View Analytics',
    description: 'View platform analytics',
  },

  // ----------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------

  {
    code: 'NOTIFICATION_VIEW',
    name: 'View Notifications',
    description: 'View notifications',
  },
  {
    code: 'NOTIFICATION_MANAGE',
    name: 'Manage Notifications',
    description: 'Manage notifications',
  },

  // ----------------------------------------------------------
  // COMMUNITY
  // ----------------------------------------------------------

  {
    code: 'COMMUNITY_VIEW',
    name: 'View Community',
    description: 'View community content',
  },
  {
    code: 'COMMUNITY_MODERATE',
    name: 'Moderate Community',
    description: 'Moderate community content',
  },

  // ----------------------------------------------------------
  // CMS
  // ----------------------------------------------------------

  {
    code: 'CMS_VIEW',
    name: 'View CMS',
    description: 'View CMS content',
  },
  {
    code: 'CMS_CREATE',
    name: 'Create CMS Content',
    description: 'Create CMS content',
  },
  {
    code: 'CMS_UPDATE',
    name: 'Update CMS Content',
    description: 'Update CMS content',
  },
  {
    code: 'CMS_DELETE',
    name: 'Delete CMS Content',
    description: 'Delete CMS content',
  },
  {
    code: 'CMS_STATUS_UPDATE',
    name: 'Update CMS Status',
    description: 'Publish or unpublish CMS content',
  },

  // ----------------------------------------------------------
  // PLATFORM MONITORING
  // ----------------------------------------------------------

  {
    code: 'PLATFORM_MONITOR_VIEW',
    name: 'View Platform Monitoring',
    description:
      'View platform health and monitoring information',
  },
] as const;

// ============================================================
// SYSTEM ROLES
// ============================================================

const roles = [
  {
    code: 'SUPER_ADMINISTRATOR',
    name: 'Super Administrator',
    description:
      'Full platform administration and system management.',
    isAdmin: true,
  },
  {
    code: 'BUSINESS_ADMINISTRATOR',
    name: 'Business Administrator',
    description:
      'Business, reporting, subscriptions, payments and operational management.',
    isAdmin: true,
  },
  {
    code: 'CUSTOMER_SUPPORT',
    name: 'Customer Support',
    description:
      'Customer account support and service operations.',
    isAdmin: true,
  },
  {
    code: 'MODERATOR',
    name: 'Moderator',
    description:
      'Content and community moderation.',
    isAdmin: true,
  },
  {
    code: 'ARTIST',
    name: 'Artist',
    description:
      'Artist-facing platform capabilities.',
    isAdmin: false,
  },
  {
    code: 'LISTENER',
    name: 'Listener',
    description:
      'Listener-facing platform capabilities.',
    isAdmin: false,
  },
] as const;


// ============================================================
// MUSIC GENRES
// ============================================================

const musicGenres = [
  {
    code: 'POP',
    name: 'Pop',
    sortOrder: 1,
  },
  {
    code: 'ROCK',
    name: 'Rock',
    sortOrder: 2,
  },
  {
    code: 'HIP_HOP',
    name: 'Hip-Hop',
    sortOrder: 3,
  },
  {
    code: 'CLASSICAL',
    name: 'Classical',
    sortOrder: 4,
  },
  {
    code: 'RAP',
    name: 'Rap',
    sortOrder: 5,
  },
  {
    code: 'JAZZ',
    name: 'Jazz',
    sortOrder: 6,
  },
  {
    code: 'FOLK',
    name: 'Folk',
    sortOrder: 7,
  },
  {
    code: 'ELECTRONIC',
    name: 'Electronic',
    sortOrder: 8,
  },
] as const;

const artistRoles = [
  {
    code: 'SINGER',
    name: 'Singer',
    sortOrder: 1,
  },
  {
    code: 'COMPOSER',
    name: 'Composer',
    sortOrder: 2,
  },
  {
    code: 'LYRICIST',
    name: 'Lyricist',
    sortOrder: 3,
  },
  {
    code: 'RAPPER',
    name: 'Rapper',
    sortOrder: 4,
  },
  {
    code: 'DJ',
    name: 'DJ',
    sortOrder: 5,
  },
  {
    code: 'REMIXER',
    name: 'Remixer',
    sortOrder: 6,
  },
  {
    code: 'ELECTRONIC_MUSIC_ARTIST',
    name: 'Electronic Music Artist',
    sortOrder: 7,
  },
] as const;



// ==========================================================
// SEED INSTRUMENTS
// ==========================================================

const instruments = [
  {
    code: 'GUITAR',
    name: 'Guitar',
    sortOrder: 1,
  },
  {
    code: 'PIANO',
    name: 'Piano',
    sortOrder: 2,
  },
  {
    code: 'FLUTE',
    name: 'Flute',
    sortOrder: 3,
  },
  {
    code: 'DRUM',
    name: 'Drum',
    sortOrder: 4,
  },
] as const;


const subscriptionPlans = [
  {
    code: 'ARTIST_PRO',
    name: 'Artist Pro',
    description:
      'Perfect For Independent Artists, Singers, Musicians, Producers & Composers',

    price: '24.99',
    currency: 'USD',

    billingPeriod: 'YEARLY' as const,

    status: 1,
    isSystem: true,

    features: [
      'Music Uploads',
      'Unlimited Releases',
      'Event & Concert Listings',
      'Fan & Follower Insights',
    ],
  },
] as const;

// ============================================================
// COUNTRY / CITY DATA
// ============================================================

const countries = [
  {
    name: 'India',
    iso2: 'IN',
    iso3: 'IND',
    phoneCode: '+91',
    cities: [
      'Ahmedabad',
      'Bengaluru',
      'Chandigarh',
      'Chennai',
      'Delhi',
      'Hyderabad',
      'Jaipur',
      'Kochi',
      'Kolkata',
      'Lucknow',
      'Mumbai',
      'Pune',
    ],
  },
  {
    name: 'United States',
    iso2: 'US',
    iso3: 'USA',
    phoneCode: '+1',
    cities: [
      'Boston',
      'Chicago',
      'Houston',
      'Los Angeles',
      'New York',
      'San Francisco',
      'Seattle',
      'Washington',
    ],
  },
  {
    name: 'United Kingdom',
    iso2: 'GB',
    iso3: 'GBR',
    phoneCode: '+44',
    cities: [
      'Birmingham',
      'Edinburgh',
      'Glasgow',
      'Leeds',
      'Liverpool',
      'London',
      'Manchester',
    ],
  },
  {
    name: 'Canada',
    iso2: 'CA',
    iso3: 'CAN',
    phoneCode: '+1',
    cities: [
      'Calgary',
      'Edmonton',
      'Montreal',
      'Ottawa',
      'Toronto',
      'Vancouver',
    ],
  },
  {
    name: 'Australia',
    iso2: 'AU',
    iso3: 'AUS',
    phoneCode: '+61',
    cities: [
      'Adelaide',
      'Brisbane',
      'Canberra',
      'Melbourne',
      'Perth',
      'Sydney',
    ],
  },
] as const;

// ============================================================


// ============================================================
// ROLE → PERMISSION MAP
// ============================================================

const allPermissionCodes = permissions.map(
  (permission) => permission.code,
);

const rolePermissions: Record<string, string[]> = {
  // Super Admin gets every permission by default.
  SUPER_ADMINISTRATOR: allPermissionCodes,

  BUSINESS_ADMINISTRATOR: [
    'USER_VIEW',
    'USER_UPDATE',
    'USER_STATUS_UPDATE',
    'USER_EMAIL_VERIFY',
    'USER_LOGIN_HISTORY_VIEW',

    'ROLE_VIEW',
    'PERMISSION_VIEW',

    'ARTIST_VIEW',
    'ARTIST_VERIFY',

    'MUSIC_GENRE_VIEW',
    'MUSIC_GENRE_CREATE',
    'MUSIC_GENRE_UPDATE',
    'MUSIC_GENRE_DELETE',
    'MUSIC_GENRE_STATUS_UPDATE',


    'ARTIST_ROLE_VIEW',
    'ARTIST_ROLE_CREATE',
    'ARTIST_ROLE_UPDATE',
    'ARTIST_ROLE_DELETE',
    'ARTIST_ROLE_STATUS_UPDATE',



    'MUSIC_VIEW',
    'MUSIC_APPROVE',
    'MUSIC_REJECT',

    'EVENT_VIEW',
    'EVENT_APPROVE',
    'EVENT_REJECT',

    'PAYMENT_VIEW',
    'SUBSCRIPTION_VIEW',
    'SUBSCRIPTION_MANAGE',

    'REPORT_VIEW',
    'REPORT_MANAGE',

    'ANALYTICS_VIEW',

    'NOTIFICATION_VIEW',
    'NOTIFICATION_MANAGE',

    'CMS_VIEW',
    'CMS_CREATE',
    'CMS_UPDATE',
    'CMS_STATUS_UPDATE',

    'PLATFORM_MONITOR_VIEW',
  ],

  CUSTOMER_SUPPORT: [
    'USER_VIEW',
    'USER_UPDATE',
    'USER_STATUS_UPDATE',
    'USER_PASSWORD_RESET',
    'USER_EMAIL_VERIFY',
    'USER_LOGIN_HISTORY_VIEW',

    'SUBSCRIPTION_VIEW',
    'PAYMENT_VIEW',

    'REPORT_VIEW',
  ],

  MODERATOR: [
    'USER_VIEW',
    'USER_STATUS_UPDATE',

    'ARTIST_VIEW',

    'MUSIC_VIEW',
    'MUSIC_APPROVE',
    'MUSIC_REJECT',

    'EVENT_VIEW',
    'EVENT_APPROVE',
    'EVENT_REJECT',

    'REPORT_VIEW',
    'REPORT_MANAGE',

    'COMMUNITY_VIEW',
    'COMMUNITY_MODERATE',

    'CMS_VIEW',
  ],

  ARTIST: [
    'MUSIC_VIEW',
    'EVENT_VIEW',
    'COMMUNITY_VIEW',
  ],

  LISTENER: [
    'MUSIC_VIEW',
    'ARTIST_VIEW',
    'EVENT_VIEW',
    'COMMUNITY_VIEW',
  ],
};

// ============================================================
// DEVELOPMENT USERS
// ============================================================

const users = [
  {
    email: 'superadmin@geomelody.local',
    firstName: 'Super',
    lastName: 'Administrator',
    roleCode: 'SUPER_ADMINISTRATOR',
    passwordEnv: 'SEED_SUPER_ADMIN_PASSWORD',
  },
  {
    email: 'businessadmin@geomelody.local',
    firstName: 'Business',
    lastName: 'Administrator',
    roleCode: 'BUSINESS_ADMINISTRATOR',
    passwordEnv: 'SEED_BUSINESS_ADMIN_PASSWORD',
  },
  {
    email: 'support@geomelody.local',
    firstName: 'Customer',
    lastName: 'Support',
    roleCode: 'CUSTOMER_SUPPORT',
    passwordEnv: 'SEED_CUSTOMER_SUPPORT_PASSWORD',
  },
  {
    email: 'moderator@geomelody.local',
    firstName: 'Content',
    lastName: 'Moderator',
    roleCode: 'MODERATOR',
    passwordEnv: 'SEED_MODERATOR_PASSWORD',
  },
  {
    email: 'artist@geomelody.local',
    firstName: 'Demo',
    lastName: 'Artist',
    roleCode: 'ARTIST',
    passwordEnv: 'SEED_ARTIST_PASSWORD',
  },
  {
    email: 'listener@geomelody.local',
    firstName: 'Demo',
    lastName: 'Listener',
    roleCode: 'LISTENER',
    passwordEnv: 'SEED_LISTENER_PASSWORD',
  },
] as const;

// ============================================================
// SEED PERMISSIONS
// ============================================================

async function seedPermissions() {
  console.log('Seeding permissions...');

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        code: permission.code,
      },

      update: {
        name: permission.name,
        description: permission.description,
        status: 1,
        deletedAt: null,
      },

      create: {
        code: permission.code,
        name: permission.name,
        description: permission.description,
        status: 1,
        isSystem: true,
      },
    });
  }

  console.log(
    `Seeded ${permissions.length} permissions.`,
  );
}

// ============================================================
// SEED ROLES
// ============================================================

async function seedRoles() {
  console.log('Seeding system roles...');

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        code: role.code,
      },

      update: {
        name: role.name,
        description: role.description,
        isAdmin: role.isAdmin,
        isSystem: true,
        status: 1,
        deletedAt: null,
      },

      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isAdmin: role.isAdmin,
        isSystem: true,
        status: 1,
      },
    });
  }

  console.log(
    `Seeded ${roles.length} system roles.`,
  );
}

// ============================================================
// SEED COUNTRIES / CITIES
// ============================================================

async function seedCountriesAndCities() {
  console.log('Seeding countries and cities...');

  for (const countryData of countries) {
    const country =
      await prisma.country.upsert({
        where: {
          iso2: countryData.iso2,
        },

        update: {
          name: countryData.name,
          iso3: countryData.iso3,
          phoneCode: countryData.phoneCode,
          status: 1,
        },

        create: {
          name: countryData.name,
          iso2: countryData.iso2,
          iso3: countryData.iso3,
          phoneCode: countryData.phoneCode,
          status: 1,
        },
      });

    for (const cityName of countryData.cities) {
      await prisma.city.upsert({
        where: {
          countryId_name: {
            countryId: country.id,
            name: cityName,
          },
        },

        update: {
          status: 1,
        },

        create: {
          countryId: country.id,
          name: cityName,
          status: 1,
        },
      });
    }
  }

  console.log(
    `Seeded ${countries.length} countries and their cities.`,
  );
}



// ============================================================
// SEED MUSIC GENRES
// ============================================================

async function seedMusicGenres() {
  console.log('Seeding music genres...');

  for (const genre of musicGenres) {
    await prisma.musicGenre.upsert({
      where: {
        code: genre.code,
      },

      update: {
        name: genre.name,
        status: 1,
        sortOrder: genre.sortOrder,
        deletedAt: null,
      },

      create: {
        code: genre.code,
        name: genre.name,
        status: 1,
        sortOrder: genre.sortOrder,
      },
    });
  }

  console.log(
    `Seeded ${musicGenres.length} music genres.`,
  );
}

async function seedArtistRoles() {
  console.log('Seeding artist roles...');

  for (const role of artistRoles) {
    await prisma.artistRole.upsert({
      where: {
        code: role.code,
      },
      update: {
        name: role.name,
        status: 1,
        sortOrder: role.sortOrder,
        deletedAt: null,
      },
      create: {
        code: role.code,
        name: role.name,
        status: 1,
        sortOrder: role.sortOrder,
      },
    });
  }

  console.log(
    `Seeded ${artistRoles.length} artist roles.`,
  );
}

async function seedInstruments() {
  console.log('Seeding instruments...');

  for (const instrument of instruments) {
    await prisma.instrument.upsert({
      where: {
        code: instrument.code,
      },

      update: {
        name: instrument.name,
        sortOrder: instrument.sortOrder,
        status: 1,
        deletedAt: null,
      },

      create: {
        code: instrument.code,
        name: instrument.name,
        image: null,
        status: 1,
        sortOrder: instrument.sortOrder,
      },
    });
  }

  console.log(
    `Seeded ${instruments.length} instruments.`,
  );
}


async function seedSubscriptionPlans() {
  console.log('Seeding subscription plans...');

  for (const planData of subscriptionPlans) {
    const plan = await prisma.subscriptionPlan.upsert({
      where: {
        code: planData.code,
      },

      update: {
        name: planData.name,
        description: planData.description,
        price: planData.price,
        currency: planData.currency,
        billingPeriod: planData.billingPeriod,
        status: planData.status,
        isSystem: planData.isSystem,
        deletedAt: null,
      },

      create: {
        code: planData.code,
        name: planData.name,
        description: planData.description,
        price: planData.price,
        currency: planData.currency,
        billingPeriod: planData.billingPeriod,
        status: planData.status,
        isSystem: planData.isSystem,
      },
    });

    await prisma.subscriptionPlanFeature.deleteMany({
      where: {
        planId: plan.id,
      },
    });

    for (
      const [index, featureName]
      of planData.features.entries()
    ) {
      await prisma.subscriptionPlanFeature.create({
        data: {
          planId: plan.id,
          name: featureName,
          sortOrder: index,
          status: 1,
        },
      });
    }
  }

  console.log(
    `Seeded ${subscriptionPlans.length} subscription plans.`,
  );
}

// ============================================================
// SEED ARTIST TYPES
// ============================================================



// ============================================================
// SEED ROLE PERMISSIONS
// ============================================================

async function seedRolePermissions() {
  console.log('Seeding role permissions...');

  for (const [roleCode, permissionCodes] of Object.entries(
    rolePermissions,
  )) {
    const role =
      await prisma.role.findUnique({
        where: {
          code: roleCode,
        },
      });

    if (!role) {
      throw new Error(
        `Role not found: ${roleCode}`,
      );
    }

    // Make system-role mappings deterministic.
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
      },
    });

    for (const permissionCode of permissionCodes) {
      const permission =
        await prisma.permission.findUnique({
          where: {
            code: permissionCode,
          },
        });

      if (!permission) {
        throw new Error(
          `Permission not found: ${permissionCode}`,
        );
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(
    'Role permissions seeded.',
  );
}

// ============================================================
// SEED DEVELOPMENT USERS
// ============================================================

async function seedUsers() {
  console.log('Seeding development users...');

  for (const user of users) {
    const password =
      process.env[user.passwordEnv];

    if (!password) {
      throw new Error(
        `${user.passwordEnv} is not configured`,
      );
    }

    const role =
      await prisma.role.findUnique({
        where: {
          code: user.roleCode,
        },
      });

    if (!role) {
      throw new Error(
        `Role not found: ${user.roleCode}`,
      );
    }

    const passwordHash =
      await argon2.hash(password);

    await prisma.user.upsert({
      where: {
        email: user.email,
      },

      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: role.id,
        status: 1,
        emailVerified: true,
        deletedAt: null,
        passwordHash,
      },

      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: role.id,
        status: 1,
        emailVerified: true,
      },
    });
  }

  console.log(
    `Seeded ${users.length} development users.`,
  );
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('');
  console.log('========================================');
  console.log(
    'GeoMelody Milestone 1 Database Seeder',
  );
  console.log('========================================');
  console.log('');

  await seedPermissions();

  await seedRoles();

  await seedCountriesAndCities();

  await seedMusicGenres();

  await seedArtistRoles();

  await seedInstruments();
  await seedSubscriptionPlans();

  await seedRolePermissions();

  await seedUsers();

  console.log('');
  console.log('========================================');
  console.log(
    'GeoMelody database seed completed',
  );
  console.log('========================================');
  console.log('');
}

// ============================================================
// EXECUTION
// ============================================================

main()
  .catch((error) => {
    console.error('');
    console.error('Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });