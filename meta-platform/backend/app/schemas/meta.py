from typing import Any, Literal

from pydantic import BaseModel, Field


class FieldConstraints(BaseModel):
    # text / textarea
    min_length: int | None = Field(default=None, alias="minLength")
    max_length: int | None = Field(default=None, alias="maxLength")
    pattern: str | None = None

    # number / progress
    min: float | None = None
    max: float | None = None
    step: float | None = None

    # date
    min_date: str | None = Field(default=None, alias="minDate")
    max_date: str | None = Field(default=None, alias="maxDate")

    # multiselect / tags
    min_items: int | None = Field(default=None, alias="minItems")
    max_items: int | None = Field(default=None, alias="maxItems")

    model_config = {"populate_by_name": True}


class XUIHints(BaseModel):
    widget: str | None = None
    kanban_group: bool = False
    color_map: dict[str, str] = {}
    placeholder: str | None = None
    readonly: bool = False
    width: str | None = None


class FieldMeta(BaseModel):
    name: str
    type: Literal["text", "textarea", "select", "multiselect", "date", "user", "tags", "number", "progress", "checkbox"]
    label: str
    required: bool = False
    options: list[str] | None = None
    default: Any = None
    x_ui: XUIHints = Field(default_factory=XUIHints, alias="x-ui")
    constraints: FieldConstraints | None = None

    model_config = {"populate_by_name": True}


class ActionMeta(BaseModel):
    id: str
    label: str
    icon: str | None = None
    variant: Literal["primary", "secondary", "danger"] = "secondary"


class EntityMeta(BaseModel):
    id: str
    name: str
    description: str = ""
    layout: Literal["kanban", "table", "form", "grid"] = "kanban"
    fields: list[FieldMeta]
    actions: list[ActionMeta] = []
    allow_attachments: bool = False
    version: int = 1
