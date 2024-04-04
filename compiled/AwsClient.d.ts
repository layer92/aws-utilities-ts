export declare class AwsClient {
    private _needs;
    private readonly _client;
    /**
     * @package _needs.linkExpirationSeconds: pass Infinity if you don't want links to expire
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
       @param options.linkExpirationSeconds: pass Infinity (not undefined) if you don't want the link to expire
     * */
    makePresignedPutObjectUrlAsync(key: string, options?: {
        maxUploadSizeBytes?: number;
        linkExpirationSeconds?: number;
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
     *  @param options.linkExpirationSeconds: pass Infinity if you don't want the link to expire
    */
    makePresignedGetObjectUrlAsync(key: string, options?: {
        linkExpirationSeconds?: number;
    }): Promise<string>;
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    deleteObjectBykeyAsync(key: string): Promise<void>;
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    getObjectSizeBytesAsync(key: string): Promise<any>;
}
