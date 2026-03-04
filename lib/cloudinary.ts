import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadPhoto(base64DataUri: string): Promise<{
    url: string;
    publicId: string;
    thumbnailUrl: string;
}> {
    const result = await cloudinary.uploader.upload(base64DataUri, {
        folder: "whereto/photos",
        resource_type: "image",
        transformation: {
            width: 1200,
            height: 1200,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
        },
        eager: [
            {
                width: 400,
                height: 400,
                crop: "fill",
                quality: "auto",
                fetch_format: "auto",
            },
        ],
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnailUrl: result.eager?.[0]?.secure_url ?? result.secure_url,
    };
}

export async function deletePhoto(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
}
