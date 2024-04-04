import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {SecondsBox} from "@layer92/core";
import { Conditions } from "@aws-sdk/s3-presigned-post/dist-types/types";

const DefaultExpirationSeconds = SecondsBox.FromHours(4).getData();

export class AwsClient{
    private readonly _client;
    
 
    /**
     * @package _needs.linkExpirationSeconds: pass Infinity if you don't want links to expire
    */
    constructor(private _needs:{
        bucketId:string,
        regionId:string,
        awsAccessKey:string,
        awsSecretKey:string,
        linkExpirationSeconds:number,
    }){
        _needs.linkExpirationSeconds = _needs.linkExpirationSeconds || DefaultExpirationSeconds;
        this._client = new S3Client({
            region:_needs.regionId,
            credentials:{
                accessKeyId: _needs.awsAccessKey,
                secretAccessKey: _needs.awsSecretKey,
            }
        });
    }

    /** 
     * Note that you can't limit filesize using a PUT url. If you need to limit filesize, use a POST url.
     * @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
       @param options.linkExpirationSeconds: pass Infinity (not undefined) if you don't want the link to expire
     * */
     async makePresignedPutObjectUrlAsync(key:string,options?:{
        maxUploadSizeBytes?:number,
        linkExpirationSeconds?:number,
     }){
        const command = new PutObjectCommand({
            Bucket:this._needs.bucketId,
            Key:key,
        });
        let linkExpirationSeconds = options?.linkExpirationSeconds??this._needs.linkExpirationSeconds;
        if(linkExpirationSeconds===Infinity){
            linkExpirationSeconds=undefined;
        }
        return getSignedUrl(this._client,command,{expiresIn:this._needs.linkExpirationSeconds});
    }

    /** 
     * @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
     * @returns.url: the url to post to
     * @returns.formDataEntries: an array in the form [key,value] to append to the formData. Usage example: `formDataEntries.map(([k,v]=>formData.append(k,v)))`
     * */
     async makePresignedObjectPostAsync(key:string,options?:{
        maxUploadSizeBytes?:number
     }){
        // the node S3Client has no PostObjectCommand, no options for content-length inCreateMultipartUploadCommand, etc...
        // see an issue about this for the .net version https://github.com/aws/aws-sdk-net/issues/1901).
        // For now, we're using createPresignedPost
        // here are a couple of examples of how to use this:
        // https://fourtheorem.com/the-illustrated-guide-to-s3-pre-signed-urls/
        // https://advancedweb.hu/how-to-use-s3-post-signed-urls/
        const conditions:Conditions[] = [];
        if(options?.maxUploadSizeBytes!==undefined){
            conditions.push(
                ["content-length-range", 0, options?.maxUploadSizeBytes]
            );
        }
        let linkExpirationSeconds = this._needs.linkExpirationSeconds;
        if(linkExpirationSeconds===Infinity){
            linkExpirationSeconds=undefined;
        }
        const {url,fields} = await createPresignedPost(this._client, {
            Bucket:this._needs.bucketId,
            Key:key,
            Conditions:conditions,
            Expires: linkExpirationSeconds,
        });
        const formDataEntries = Object.entries(fields);
        return {url,formDataEntries};
    }

    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc...
     *  @param options.linkExpirationSeconds: pass Infinity if you don't want the link to expire
    */
    async makePresignedGetObjectUrlAsync(key:string,options?:{
        linkExpirationSeconds?:number,
    }){
        let linkExpirationSeconds = options?.linkExpirationSeconds??this._needs.linkExpirationSeconds;
        if(linkExpirationSeconds===Infinity){
            linkExpirationSeconds=undefined;
        }
        const command = new GetObjectCommand({
            Bucket:this._needs.bucketId,
            Key:key,
        });
        return getSignedUrl(this._client,command,{expiresIn:linkExpirationSeconds});
    }

    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async deleteObjectBykeyAsync(key:string){
        const command = new DeleteObjectCommand({
            Bucket:this._needs.bucketId,
            Key:key,
        });
        const result = await this._client.send(command);
    }

    /** @param key: a path on the bucket, eg "foo.png", "foo/bar.txt", etc... */
    async getObjectSizeBytesAsync(key:string){
        const command = new HeadObjectCommand({
            Bucket:this._needs.bucketId,
            Key:key,
        });
        const result = await this._client.send(command);
        return result.ContentLength||0;
    }
}