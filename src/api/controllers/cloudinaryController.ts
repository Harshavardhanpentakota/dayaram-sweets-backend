import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

const ensureCloudinaryConfigured = (): string | null => {
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;

	if (!cloudName || !apiKey || !apiSecret) {
		return 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.';
	}

	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	});

	return null;
};

export const uploadImageToCloudinary = async (req: Request, res: Response): Promise<void> => {
	try {
		const configError = ensureCloudinaryConfigured();
		if (configError) {
			res.status(500).json({ message: configError });
			return;
		}

		if (!req.file) {
			res.status(400).json({ message: 'No image uploaded. Use form-data field name: image' });
			return;
		}

		const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
		const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
			? req.body.folder.trim()
			: 'dayaram-sweets/products';

		const result = await cloudinary.uploader.upload(base64Image, {
			folder,
			resource_type: 'image',
			use_filename: true,
			unique_filename: true,
			overwrite: false,
		});

		res.status(201).json({
			message: 'Image uploaded successfully',
			data: {
				url: result.secure_url,
				publicId: result.public_id,
				format: result.format,
				width: result.width,
				height: result.height,
				bytes: result.bytes,
			},
		});
	} catch (error: any) {
		res.status(500).json({
			message: 'Failed to upload image to Cloudinary',
			error: error?.message || 'Unknown error',
		});
	}
};

/**
 * Generate a short-lived, signed set of params so the frontend can upload an
 * image DIRECTLY to Cloudinary (no image bytes ever pass through this server).
 *
 * Flow:
 *   1. Frontend calls GET /api/cloudinary-signature (authenticated).
 *   2. Frontend POSTs the file to Cloudinary using the returned params.
 *   3. Cloudinary returns a secure_url.
 *   4. Frontend sends that url in `images` when creating the product.
 *
 * NOTE: every param included in `paramsToSign` (here: folder + timestamp) MUST
 * be sent by the frontend to Cloudinary verbatim, or the signature check fails.
 */
export const getCloudinaryUploadSignature = async (req: Request, res: Response): Promise<void> => {
	try {
		const configError = ensureCloudinaryConfigured();
		if (configError) {
			res.status(500).json({ message: configError });
			return;
		}

		const apiSecret = process.env.CLOUDINARY_API_SECRET as string;
		const apiKey = process.env.CLOUDINARY_API_KEY as string;
		const cloudName = process.env.CLOUDINARY_CLOUD_NAME as string;

		const folder = typeof req.query.folder === 'string' && req.query.folder.trim()
			? req.query.folder.trim()
			: 'dayaram-sweets/products';

		// Cloudinary expects the timestamp in seconds.
		const timestamp = Math.round(Date.now() / 1000);

		const paramsToSign: Record<string, string | number> = {
			timestamp,
			folder,
		};

		const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

		res.status(200).json({
			message: 'Cloudinary upload signature generated',
			data: {
				signature,
				timestamp,
				folder,
				apiKey,
				cloudName,
			},
		});
	} catch (error: any) {
		res.status(500).json({
			message: 'Failed to generate Cloudinary signature',
			error: error?.message || 'Unknown error',
		});
	}
};

const extractPublicIdFromCloudinaryUrl = (imageUrl: string): string | null => {
	try {
		const parsedUrl = new URL(imageUrl);
		if (!parsedUrl.hostname.includes('cloudinary.com')) {
			return null;
		}

		const path = parsedUrl.pathname;
		const uploadIndex = path.indexOf('/upload/');
		if (uploadIndex === -1) {
			return null;
		}

		const afterUpload = path.slice(uploadIndex + '/upload/'.length);
		const rawSegments = afterUpload.split('/').filter(Boolean);
		if (rawSegments.length === 0) {
			return null;
		}

		let startIndex = 0;
		for (let i = 0; i < rawSegments.length; i++) {
			if (/^v\d+$/.test(rawSegments[i])) {
				startIndex = i + 1;
				break;
			}
		}

		const publicIdWithExt = rawSegments.slice(startIndex).join('/');
		if (!publicIdWithExt) {
			return null;
		}

		return publicIdWithExt.replace(/\.[^/.]+$/, '');
	} catch {
		return null;
	}
};

export const cancelImageUpload = async (req: Request, res: Response): Promise<void> => {
	try {
		const configError = ensureCloudinaryConfigured();
		if (configError) {
			res.status(500).json({ message: configError });
			return;
		}

		const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
		const isCancelled = req.body?.cancel === true || req.body?.cancelled === true || req.body?.isCancelled === true;

		if (!imageUrl) {
			res.status(400).json({ message: 'imageUrl is required' });
			return;
		}

		if (!isCancelled) {
			res.status(400).json({ message: 'Cancel info is required. Set cancel, cancelled, or isCancelled to true.' });
			return;
		}

		const publicId = extractPublicIdFromCloudinaryUrl(imageUrl);
		if (!publicId) {
			res.status(400).json({ message: 'Invalid Cloudinary image URL' });
			return;
		}

		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: 'image',
		});

		if (result.result !== 'ok' && result.result !== 'not found') {
			res.status(500).json({ message: 'Failed to delete image from Cloudinary', data: result });
			return;
		}

		res.status(200).json({
			message: 'Cancelled image removed from Cloudinary',
			data: {
				publicId,
				result: result.result,
			},
		});
	} catch (error: any) {
		res.status(500).json({
			message: 'Failed to process image cancel request',
			error: error?.message || 'Unknown error',
		});
	}
};
