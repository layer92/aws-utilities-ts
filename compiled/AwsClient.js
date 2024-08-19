"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsClient = void 0;
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const core_1 = require("@layer92/core");
const DefaultExpirationSeconds = (0, core_1.HoursToSeconds)(4);
class AwsClient {
    /**
     * @package _needs.linkExpirationSeconds: pass Infinity if you want to use the max expiration time AWS allows (probably 7 days)
    */
    constructor(_needs) {
        this._needs = _needs;
        _needs.linkExpirationSeconds = _needs.linkExpirationSeconds || DefaultExpirationSeconds;
        this._client = new client_s3_1.S3Client({
            region: _needs.regionId,
            credentials: {
                accessKeyId: _needs.awsAccessKey,
                secretAccessKey: _needs.awsSecretKey,
            }
        });
    }
    /**
     * Note that you can't limit filesize using a PUT url. If you need to limit filesize, use a POST url.
     * @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
       @param options.linkExpirationSeconds: pass Infinity if you want to use the max expiration time AWS allows (probably 7 days)
     * */
    async makePresignedPutObjectUrlAsync(key, options) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this._needs.bucketId,
            Key: key,
        });
        let linkExpirationSeconds = options?.linkExpirationSeconds ?? this._needs.linkExpirationSeconds;
        if (linkExpirationSeconds === Infinity) {
            linkExpirationSeconds = undefined;
        }
        return (0, s3_request_presigner_1.getSignedUrl)(this._client, command, { expiresIn: this._needs.linkExpirationSeconds });
    }
    /**
     * @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
     * @returns.url: the url to post to
     * @returns.formDataEntries: an array in the form [key,value] to append to the formData. Usage example: `formDataEntries.map(([k,v]=>formData.append(k,v)))`
     * */
    async makePresignedObjectPostAsync(key, options) {
        // the node S3Client has no PostObjectCommand, no options for content-length inCreateMultipartUploadCommand, etc...
        // see an issue about this for the .net version https://github.com/aws/aws-sdk-net/issues/1901).
        // For now, we're using createPresignedPost
        // here are a couple of examples of how to use this:
        // https://fourtheorem.com/the-illustrated-guide-to-s3-pre-signed-urls/
        // https://advancedweb.hu/how-to-use-s3-post-signed-urls/
        const conditions = [];
        if (options?.maxUploadSizeBytes !== undefined) {
            conditions.push(["content-length-range", 0, options?.maxUploadSizeBytes]);
        }
        let linkExpirationSeconds = this._needs.linkExpirationSeconds;
        if (linkExpirationSeconds === Infinity) {
            linkExpirationSeconds = undefined;
        }
        const { url, fields } = await (0, s3_presigned_post_1.createPresignedPost)(this._client, {
            Bucket: this._needs.bucketId,
            Key: key,
            Conditions: conditions,
            Expires: linkExpirationSeconds,
        });
        const formDataEntries = Object.entries(fields);
        return { url, formDataEntries };
    }
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
     *  @param options.linkExpirationSeconds: pass Infinity if you want to use the max expiration time AWS allows (probably 7 days)
    */
    async makePresignedGetObjectUrlAsync(key, options) {
        let linkExpirationSeconds = options?.linkExpirationSeconds ?? this._needs.linkExpirationSeconds;
        if (linkExpirationSeconds === Infinity) {
            linkExpirationSeconds = undefined;
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this._needs.bucketId,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this._client, command, { expiresIn: linkExpirationSeconds });
    }
    /**
     * @returns the URL to the object on the bucket, which may or may not be accessible depending on the bucket's policy
    */
    makeUnsignedGetObjectUrl(key) {
        const { bucketId, regionId } = this._needs;
        return `https://${bucketId}.s3.${regionId}.amazonaws.com/${key}`;
    }
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async deleteObjectByKeyAsync(key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this._needs.bucketId,
            Key: key,
        });
        const result = await this._client.send(command);
    }
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async doesObjectExistAsync(key) {
        let exists = true;
        try {
            await this.headObjectByKeyAsync(key, { onObjectNotFound: () => exists = false });
        }
        catch (e) {
            if (exists) {
                throw e;
            }
        }
        return exists;
    }
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async getObjectSizeBytesAsync(key) {
        const head = await this.headObjectByKeyAsync(key);
        return head.ContentLength || 0;
    }
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async getObjectSha256SumAsync(key) {
        const head = await this.headObjectByKeyAsync(key);
        return head.ChecksumSHA256;
    }
    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async headObjectByKeyAsync(key, options) {
        const command = new client_s3_1.HeadObjectCommand({
            Bucket: this._needs.bucketId,
            Key: key,
        });
        try {
            const result = await this._client.send(command);
            return result;
        }
        catch (e) {
            if (e instanceof client_s3_1.S3ServiceException) {
                if (e.$response.statusCode === 404) {
                    options?.onObjectNotFound?.();
                }
            }
            throw e;
        }
    }
}
exports.AwsClient = AwsClient;
