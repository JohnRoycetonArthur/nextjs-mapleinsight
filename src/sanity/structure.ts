import type {StructureResolver} from 'sanity/structure'
import {CountryDataHealthDashboard} from './components/CountryDataHealthDashboard'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // ─── Country Costs (grouped by seed state) ───────────────────────────────
      S.listItem()
        .title('Country Costs')
        .child(
          S.list()
            .title('Country Costs')
            .items([
              S.listItem()
                .title('Seeded Countries')
                .child(
                  S.documentList()
                    .title('Seeded Countries')
                    .filter('_type == "countryCosts" && isSeeded == true && iso != "ZZ"')
                    .defaultOrdering([{ field: 'countryName', direction: 'asc' }])
                ),
              S.listItem()
                .title('Data Pending')
                .child(
                  S.documentList()
                    .title('Data Pending')
                    .filter('_type == "countryCosts" && isSeeded == false')
                    .defaultOrdering([{ field: 'countryName', direction: 'asc' }])
                ),
              S.listItem()
                .title('ZZ Default Fallback')
                .child(
                  S.documentList()
                    .title('ZZ Default Fallback')
                    .filter('_type == "countryCosts" && iso == "ZZ"')
                ),
              S.divider(),
              S.listItem()
                .title('Country Data Health — Top 25')
                .child(
                  S.documentList()
                    .title('Country Data Health — Top 25')
                    .filter(
                      '_type == "countryCosts" && iso in ["IN","PH","NG","CN","PK","BR","FR","GB","AE","KE","MX","ZA","VN","EG","US","CO","ET","BD","GH","IR","KR","JP","DE","UA","RO"]',
                    )
                    .defaultOrdering([{ field: 'countryName', direction: 'asc' }])
                ),
            ])
        ),

      // ─── Data Health ──────────────────────────────────────────────────────────
      S.listItem()
        .title('Data Health')
        .id('data-health')
        .child(
          S.component(CountryDataHealthDashboard)
            .id('country-data-health')
            .title('Country Data Health'),
        ),

      S.divider(),

      // ─── All other document types ─────────────────────────────────────────────
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== 'countryCosts',
      ),
    ])
