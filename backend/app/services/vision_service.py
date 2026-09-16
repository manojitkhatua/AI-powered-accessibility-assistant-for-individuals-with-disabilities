from ultralytics import YOLO


class VisionService:
    def __init__(self):
        self.model = YOLO("yolo11n.pt")

    def detect(self, image_path: str) -> list[dict]:
        results = self.model(image_path, verbose=False)

        detections = []

        for result in results:
            if result.boxes is None:
                continue

            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(float, box.xyxy[0])

                detections.append(
                    {
                        "object_name": result.names[class_id],
                        "confidence": round(confidence, 3),
                        "bbox": [x1, y1, x2, y2],
                    }
                )

        return detections


vision_service = VisionService()