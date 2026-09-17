class SpatialService:
    def get_horizontal_position(
        self,
        bbox: list[float],
        image_width: int,
    ) -> str:
        x1, _, x2, _ = bbox

        object_center_x = (x1 + x2) / 2
        image_center_x = image_width / 2

        if object_center_x < image_width * 0.33:
            return "left"

        if object_center_x > image_width * 0.67:
            return "right"

        return "center"


spatial_service = SpatialService()