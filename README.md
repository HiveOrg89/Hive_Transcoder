# Transcoding Server

This transcoding server is designed to process video files into multiple streams for adaptive bitrate streaming. The output manifest is compliant with the DASH (Dynamic Adaptive Streaming over HTTP) standard, ensuring seamless playback across a variety of devices and browsers.

## Features

- **High-Performance Transcoding**: Runs on **32 vCPU c7g EC2 instances** to handle up to **5 simultaneous video transcodes** efficiently.
- **Adaptive Bitrate Streaming**: Produces multiple video streams at different resolutions and bitrates for smooth playback across varying network conditions.
- **CRF-Optimized Encoding**: Uses **FFmpeg** with `-crf 28` to balance video quality and size, while ensuring the bitrate of the transcoded video never exceeds the original.
- **Resolution Support**: Supports transcoding up to **4K resolution** using the **H.264 video codec** and **AAC audio codec** in **8-bit** for maximum browser compatibility.
- **Real-Time Queue Management**: Integrates with **Supabase** to retrieve video tasks from an external queue and dynamically add videos to the queue when fewer than 5 jobs are running.
- **Thumbnails and Video Previews**: Extracts thumbnails using **Sharp** and generates video preview sprites with **FFmpeg** for enhanced frontend user experience.
- **Future Codec Plans**: Plans to migrate to **VP9** for better compression once suitable GPU instances are available in the region (e.g., **ap-south-1** currently lacks GPU-enabled EC2 instances).

## Why These Configurations?

- **CPU-Optimized Instances**: The current setup uses CPU-only instances (c7g) due to the lack of GPU availability in the **ap-south-1 AWS region**.
- **Browser Compatibility**: H.264 codec and 8-bit video ensure compatibility across most modern browsers without needing additional transcoding formats.
- **Storage Efficiency**: Focused on maintaining a balance between video quality and file size due to limited storage constraints.

## How It Works

1. **Video Queue Retrieval**: Videos are retrieved from an external queue in Supabase. The server monitors the queue and adds new tasks dynamically.
2. **Transcoding**:
   - Utilizes FFmpeg with CRF encoding (`-crf 28`) to maintain quality.
   - Limits the transcoded video bitrate to never exceed the original source bitrate at any resolution.
3. **Thumbnails & Sprites**:
   - **Sharp** compresses extracted thumbnails.
   - FFmpeg creates preview sprites (palettes) for efficient frontend integration.
4. **Output**: Transcoded streams and a DASH-compliant manifest file are produced.

## Current Limitations

- **VP9 Encoding**: Not yet implemented due to slow encoding on CPU-only instances.
- **GPU Availability**: GPU-enabled instances are unavailable in the **ap-south-1 region**, which limits encoding performance for advanced codecs like VP9 or AV1.

## Future Enhancements

- **Migration to VP9**: Once GPU instances are available, the server will transition to VP9 for better compression and quality.
- **Increased Parallelism**: Explore higher-capacity instances or improved parallel processing to handle more jobs simultaneously.
- **Expanded Codec Support**: Add support for newer codecs like AV1 for improved efficiency.
