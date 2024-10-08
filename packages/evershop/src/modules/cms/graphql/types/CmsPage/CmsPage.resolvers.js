const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getCmsPagesBaseQuery
} = require('../../../services/getCmsPagesBaseQuery');
const { CMSPageCollection } = require('../../../services/CMSPageCollection');

module.exports = {
  Query: {
    cmsPage: async (root, { id }, { pool }) => {
      const query = getCmsPagesBaseQuery();
      query.where('cms_page_id', '=', id);
      const page = await query.load(pool);
      return page ? camelCase(page) : null;
    },
    cmsPages: async (_, { filters = [] }, { user }) => {
      const query = getCmsPagesBaseQuery();
      const root = new CMSPageCollection(query);
      await root.init(filters, !!user);
      return root;
    },
    staticPageBySlug: async (_, { urlKey }, { pool }) => {
      const query = getCmsPagesBaseQuery();
      query.andWhere('url_key', '=', urlKey);
    
      const page = await query.load(pool);

      return page ? camelCase(page)  : null;
    },
    staticPages: async (_, {}, { homeUrl, pool }) => {
      const query = getCmsPagesBaseQuery();
    
      const pages = await query.execute(pool);

      return pages.map(page => {
        return {
          ...camelCase(page),
        };
      });
    }
  },
  CmsPage: {
    accessUrl: ({ urlKey }, {}, { homeUrl }) => `${homeUrl}${buildUrl('cmsPageView', { url_key: urlKey })}`,
    url: ({ urlKey }) => buildUrl('cmsPageView', { url_key: urlKey }),
    editUrl: ({ uuid }) => buildUrl('cmsPageEdit', { id: uuid }),
    updateApi: (page) => buildUrl('updateCmsPage', { id: page.uuid }),
    deleteApi: (page) => buildUrl('deleteCmsPage', { id: page.uuid })
  }
};
