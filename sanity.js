import {
   // createCurrentUserHook,
    createClient
} from "next-sanity";
import imageUrlBuilder from "@sanity/image-url"

export const config = {
    /**
     * find your project id and dataset in 'sanity.json' in your studio project.
     * these are considered 'public', but youcan use environment variables if you want to differ between local dev and production
     * 
     * https://nextjs.org/docs/basic-features/environment-variables
     **/
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    apiVersion: "2021-03-25",
    /**
     * set useCdn to 'false' if your application requires the freshest possible data always (potentially slightly slower and a bit more expensive). 
     * authenticated request (like preview) will always bypass the CDN
     **/
    useCdn: process.env.NODE_ENV === "production"
};

// set up the client for fetching data in the getProps page functions
export const sanityClient = createClient(config);

/**
 * set up a helper function for generating image URLs with only the asset reference data in your documents
 * read more: https://www.sanity.io/docs/image-url
 */
export const urlFor = (source) => imageUrlBuilder(config).image(source);

// helper function for using the current logged in user acct
// export const useCurrentUser = createCurrentUserHook(config);