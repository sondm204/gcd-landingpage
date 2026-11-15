# Geography-game assets

The ten local WebP files are resized/re-encoded from the following Wikimedia Commons photographs. The interface displays author/license credits and reveals source links after each answer. File order is intentionally neutral so the question does not display a place name.

| File | Photograph / author | Source | License |
| --- | --- | --- | --- |
| 01.webp | Ha Long Bay, Vietnam, View from above — Vyacheslav Argenberg | https://commons.wikimedia.org/wiki/File:Ha_Long_Bay,_Vietnam,_View_from_above.jpg | https://creativecommons.org/licenses/by/4.0/ |
| 02.webp | Hoi An Japanische Brücke — Alice Stoecklin | https://commons.wikimedia.org/wiki/File:Hoi_An_Japanische_Br%C3%BCcke.jpg | https://creativecommons.org/licenses/by-sa/3.0/ |
| 03.webp | Ngọ Môn — Bùi Thụy Đào Nguyên | https://commons.wikimedia.org/wiki/File:Ng%E1%BB%8D_M%C3%B4n.png | https://creativecommons.org/licenses/by-sa/4.0/ |

Changes: thumbnails downloaded at 1280px, normalized orientation, resized to 1200px, encoded as WebP; the responsive image container may crop the display. Share-alike photo derivatives retain the respective source license. These photo licenses do not apply to unrelated project code.

`app/game/place/map-data.json` contains Vietnam and surrounding-country geometry extracted from Natural Earth's `ne_50m_admin_0_countries.geojson`, rounded to four decimal places. Dataset source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson . Data is public domain: https://www.naturalearthdata.com/about/terms-of-use/ . The map uses a plate carrée projection; distances use Haversine on latitude/longitude, not pixel distances.

Hoàng Sa and Trường Sa are explicitly labeled as Vietnamese archipelagos. Their dotted symbols indicate approximate archipelago locations, not island coastlines or maritime boundaries. Mainland geometry is generalized at 1:50m and is not an official administrative map. The map and photographs load locally without API keys or third-party map tile requests.

Heritage context: https://whc.unesco.org/en/list/672/ , https://whc.unesco.org/en/list/948/ , https://whc.unesco.org/en/list/678/ . Targets correspond to the pictured landmark/viewpoint, not the centroid of an entire heritage area.


Additional photographs (North / Central / South):

| File | Location / author | Source | License |
| --- | --- | --- | --- |
| 04.webp | Khuê Văn Các · Văn Miếu / David Stanley | https://commons.wikimedia.org/wiki/File:Khue_Van_Pavilion.jpg | https://creativecommons.org/licenses/by/2.0 |
| 05.webp | Quần thể danh thắng Tràng An / Benjamin Smith | https://commons.wikimedia.org/wiki/File:Trang_An_-_02.jpg | https://creativecommons.org/licenses/by-sa/4.0 |
| 06.webp | Thánh địa Mỹ Sơn / Philip Nalangan | https://commons.wikimedia.org/wiki/File:My_Son_Sanctuary_Vietnam_02.jpg | https://creativecommons.org/licenses/by/4.0 |
| 07.webp | Động Phong Nha / Edgardo W. Olivera | https://commons.wikimedia.org/wiki/File:Cueva_Phong_Nha,_Vietnam_(38652790530).jpg | https://creativecommons.org/licenses/by/2.0 |
| 08.webp | Dinh Độc Lập / Alexis Lê-Quôc | https://commons.wikimedia.org/wiki/File:Reunification_Palace_from_above.jpg | https://creativecommons.org/licenses/by/2.0 |
| 09.webp | Chợ Bến Thành / Jean-Marie Hullot | https://commons.wikimedia.org/wiki/File:Ben_Thanh_Market.jpg | https://creativecommons.org/licenses/by/3.0 |
| 10.webp | Chợ nổi Cái Răng / Trần Đăng Khoa / David (nlwiki) | https://commons.wikimedia.org/wiki/File:Cho_noi_(Cai_Rang,_Can_Tho).JPG | https://creativecommons.org/licenses/by-sa/3.0/ |

04.webp uses a 960px preview; 10.webp uses the available 330px preview, without upscaling. Other new photos use 1280px previews resized to 1200px. Re-encoded photo derivatives retain the indicated source license.
