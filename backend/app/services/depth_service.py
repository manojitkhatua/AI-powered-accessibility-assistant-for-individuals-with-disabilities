import numpy as np
from PIL import Image
from transformers import pipeline


class DepthService:
    def __init__(self):
        self.pipe = pipeline(
            "depth-estimation",
            model="depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf",
        )

    def estimate_distances(
        self,
        image_path: str,
        detections: list[dict],
    ) -> list[dict]:
        image = Image.open(image_path)
        result = self.pipe(image)

        depth_map = np.array(result["predicted_depth"])

        height, width = depth_map.shape

        for detection in detections:
            x1, y1, x2, y2 = detection["bbox"]

            x1 = max(0, min(int(x1), width - 1))
            x2 = max(0, min(int(x2), width))
            y1 = max(0, min(int(y1), height - 1))
            y2 = max(0, min(int(y2), height))

            if x2 <= x1 or y2 <= y1:
                continue

            # Use the central 50% of the bounding box
            box_width = x2 - x1
            box_height = y2 - y1

            center_x1 = x1 + int(box_width * 0.25)
            center_x2 = x1 + int(box_width * 0.75)
            center_y1 = y1 + int(box_height * 0.25)
            center_y2 = y1 + int(box_height * 0.75)

            object_depth = depth_map[
                center_y1:center_y2,
                center_x1:center_x2,
            ]

            if object_depth.size == 0:
                continue

            distance = float(np.median(object_depth))

            detection["distance_m"] = round(distance, 2)

        return detections


depth_service = DepthService()