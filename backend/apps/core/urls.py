from django.urls import path

from apps.core.views import HealthLiveView, HealthReadyView

urlpatterns = [
    path("", HealthLiveView.as_view(), name="health-live"),
    path("ready/", HealthReadyView.as_view(), name="health-ready"),
]
