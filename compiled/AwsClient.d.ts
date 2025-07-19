import { HeadObjectCommandOutput } from "@aws-sdk/client-s3";
export declare class AwsClient {
    private _needs;
    private readonly _client;
    /**
     * @package _needs.linkExpirationSeconds: pass Infinity if you want to use the max expiration time AWS allows (probably 7 days)
    */
    constructor(_needs: {
        bucketId: string;
        regionId: string;
        awsAccessKey: string;
        awsSecretKey: string;
        linkExpirationSeconds: number;
    });
    /**
     * Note that you can't limit filesize using a PUT url. If you need to limit filesize, use a POST url.
     * @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
       @param options.linkExpirationSeconds: pass Infinity if you want to use the max expiration time AWS allows (probably 7 days)
     * */
    makePresignedPutObjectUrlAsync(key: string, options?: {
        maxUploadSizeBytes?: number;
        linkExpirationSeconds?: number;
        contentDisposition?: string;
    }): Promise<string>;
    /**
     * @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
     * @returns.url: the url to post to
     * @returns.formDataEntries: an array in the form [key,value] to append to the formData. Usage example: `formDataEntries.map(([k,v]=>formData.append(k,v)))`
     * */
    makePresignedObjectPostAsync(key: string, options?: {
        maxUploadSizeBytes?: number;
    }): Promise<{
        url: string;
        formDataEntries: [string, string][];
    }>;
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
     *  @param options.linkExpirationSeconds: pass Infinity if you want to use the max expiration time AWS allows (probably 7 days)
    */
    makePresignedGetObjectUrlAsync(key: string, options?: {
        linkExpirationSeconds?: number;
    }): Promise<string>;
    /**
     * @returns the URL to the object on the bucket, which may or may not be accessible depending on the bucket's policy
    */
    makeUnsignedGetObjectUrl(key: string): string;
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    deleteObjectByKeyAsync(key: string): Promise<void>;
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    doesObjectExistAsync(key: string): Promise<boolean>;
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    headObjectByKeyAsync(key: string, options?: {
        onObjectNotFound: () => any;
    }): Promise<HeadObjectCommandOutput>;
}
