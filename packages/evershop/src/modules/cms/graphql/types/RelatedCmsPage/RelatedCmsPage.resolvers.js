const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');

module.exports = {
  CmsPage: {
    relatedCmsPages: async (cmsPage, _, { pool }) => {
      const query = select().from('related_cms_page');
      query
        .leftJoin('cms_page')
        .on('related_cms_page.parent_id', '=', 'cms_page.cms_page_id');
      query
        .leftJoin('cms_page_description')
        .on(
          'related_cms_page.parent_id',
          '=',
          'cms_page_description.cms_page_description_cms_page_id'
        );
      query.where('related_cms_page.cms_page_id', '=', cmsPage.cmsPageId);

      const results = await query.execute(pool);

      return results.map((result) => camelCase(result));
    }
  }
};
