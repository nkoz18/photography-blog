import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsGalleryItem extends Struct.ComponentSchema {
  collectionName: 'components_sections_gallery_items';
  info: {
    description: 'An individual image in a gallery with caption and display options';
    displayName: 'Gallery Item';
  };
  options: {
    increments: true;
    timestamps: true;
  };
  attributes: {
    alt_text: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    display_size: Schema.Attribute.Enumeration<
      ['small', 'medium', 'large', 'full']
    > &
      Schema.Attribute.DefaultTo<'medium'>;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_decoration_heroes';
  info: {
    icon: 'address-card';
    name: 'Hero';
  };
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsImageGallery extends Struct.ComponentSchema {
  collectionName: 'components_sections_image_galleries';
  info: {
    description: 'A gallery of images that can be reordered with large previews';
    displayName: 'Image Gallery';
  };
  options: {
    increments: true;
    timestamps: true;
  };
  attributes: {
    caption: Schema.Attribute.String;
    gallery_items: Schema.Attribute.Component<'sections.gallery-item', true> &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'sections.gallery-item': SectionsGalleryItem;
      'sections.hero': SectionsHero;
      'sections.image-gallery': SectionsImageGallery;
      'shared.seo': SharedSeo;
    }
  }
}
