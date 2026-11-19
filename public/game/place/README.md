# Geography-game assets

The thirty local WebP files are resized/re-encoded from the following Wikimedia Commons photographs. The interface displays author/license credits and reveals source links after each answer. File order is intentionally neutral so the question does not display a place name.

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


## Expanded location pool (11-30)

Each region now has ten locations. Each round draws ten without replacement from the full pool, in both online and event modes.

| File | Location / author | Source | License |
| --- | --- | --- | --- |
| 11.webp | Tháp Rùa · Hồ Hoàn Kiếm / Khoitran1957 | https://commons.wikimedia.org/wiki/File:Turtle_Tower,_Hoan_Kiem_Lake,_Hanoi_4G4A7301.jpg | CC BY-SA 4.0 - https://creativecommons.org/licenses/by-sa/4.0 |
| 12.webp | Chùa Một Cột / Jakub Hałun | https://commons.wikimedia.org/wiki/File:One_Pillar_Pagoda,_Hanoi,_Vietnam,_20240123_1122_3222.jpg | CC BY 4.0 - https://creativecommons.org/licenses/by/4.0 |
| 13.webp | Thác Bản Giốc / Adam Jones from Kelowna, BC, Canada | https://commons.wikimedia.org/wiki/File:Ban_Gioc_Waterfall_-_Trung_Kanh_District_-_Cao_Bang_Province_-_Vietnam_-_11_(48119809353).jpg | CC BY-SA 2.0 - https://creativecommons.org/licenses/by-sa/2.0 |
| 14.webp | Ruộng bậc thang Sa Pa / Konstantin Krismer | https://commons.wikimedia.org/wiki/File:Terraced_fields_Sa_Pa_Vietnam.JPG | CC BY 3.0 - https://creativecommons.org/licenses/by/3.0 |
| 15.webp | Đồi A1 · Điện Biên Phủ / Adam Jones from Kelowna, BC, Canada | https://commons.wikimedia.org/wiki/File:Crater_Left_by_Vietminh_Dynamite_Blast_-_Hill_A1_(Eliane_2)_-_Dien_Bien_Phu_-_Vietnam_(48168795271).jpg | CC BY-SA 2.0 - https://creativecommons.org/licenses/by-sa/2.0 |
| 16.webp | Hồ Ba Bể / Daniel Vaulot | https://commons.wikimedia.org/wiki/File:Ba_Be_Lake_6464.jpg | CC BY-SA 2.5 - https://creativecommons.org/licenses/by-sa/2.5 |
| 17.webp | Sông Nho Quế · Mã Pí Lèng / NKSTTSSHNVN | https://commons.wikimedia.org/wiki/File:TuSan_Canyon.jpg | CC BY-SA 4.0 - https://creativecommons.org/licenses/by-sa/4.0 |
| 18.webp | Tháp Bà Ponagar / Arian Zwegers | https://commons.wikimedia.org/wiki/File:Nha_Trang,_Po_Nagar_Cham,_North_Tower_(6223880651).jpg | CC BY 2.0 - https://creativecommons.org/licenses/by/2.0 |
| 19.webp | Gành Đá Đĩa / Prince Roy | https://commons.wikimedia.org/wiki/File:Basalt_rocks_at_G%C3%A0nh_%C4%90%C3%A1_%C4%90%C4%A9a.jpg | CC BY 2.0 - https://creativecommons.org/licenses/by/2.0 |
| 20.webp | Cầu Rồng / Person-with-No Name | https://commons.wikimedia.org/wiki/File:Da_Nang_Dragon_Bridge.jpg | CC BY 2.0 - https://creativecommons.org/licenses/by/2.0 |
| 21.webp | Lăng Tự Đức / Nowic | https://commons.wikimedia.org/wiki/File:Hue_-_Tomb_of_Emperor_Tu_Duc_-_002.jpg | CC BY-SA 3.0 - https://creativecommons.org/licenses/by-sa/3.0 |
| 22.webp | Hồ Xuân Hương / Robert Tannemaat | https://commons.wikimedia.org/wiki/File:Xuan_Huong_lake_from_Dalat_Palace_Hotel.jpg | CC BY 2.0 - https://creativecommons.org/licenses/by/2.0 |
| 23.webp | Đồi cát Mũi Né / Vyacheslav Argenberg | https://commons.wikimedia.org/wiki/File:Vietnam,_Mui_Ne_sand_dune.jpg | CC BY 4.0 - https://creativecommons.org/licenses/by/4.0 |
| 24.webp | Nhà thờ Đức Bà Sài Gòn / Diego Delso | https://commons.wikimedia.org/wiki/File:Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora,_Ciudad_Ho_Chi_Minh,_Vietnam,_2013-08-14,_DD_09.JPG | CC BY-SA 3.0 - https://creativecommons.org/licenses/by-sa/3.0 |
| 25.webp | Tòa Thánh Tây Ninh / Grossbildjaeger | https://commons.wikimedia.org/wiki/File:Tempel_Cao_Dai_Frontansicht_Tay_Ninh_Vietnam.JPG | CC BY-SA 3.0 - https://creativecommons.org/licenses/by-sa/3.0 |
| 26.webp | Chùa Bửu Long / minhphuc_99kdd | https://commons.wikimedia.org/wiki/File:B%E1%BB%ADu_Long_Pagoda,_Th%E1%BB%A7_%C4%90%E1%BB%A9c,_HCM_City,_Vietnam_(14537196651).jpeg | Public domain - https://commons.wikimedia.org/wiki/File:B%E1%BB%ADu_Long_Pagoda,_Th%E1%BB%A7_%C4%90%E1%BB%A9c,_HCM_City,_Vietnam_(14537196651).jpeg#Licensing |
| 27.webp | Bãi Sao · Phú Quốc / Trantuonglam | https://commons.wikimedia.org/wiki/File:Bai-sao-phu-quoc-tuonglamphotos.jpg | CC BY-SA 4.0 - https://creativecommons.org/licenses/by-sa/4.0 |
| 28.webp | Mũi Cà Mau / HaMinh1997 at Vietnamese Wikipedia | https://commons.wikimedia.org/wiki/File:M%C5%A9iC%C3%A0Mau.jpg | CC BY-SA 3.0 - https://creativecommons.org/licenses/by-sa/3.0 |
| 29.webp | Chùa Vĩnh Tràng / shankar s. from Dubai, united arab emirates | https://commons.wikimedia.org/wiki/File:Great_landscaping_at_the_Vinh_Trang_pagoda_(32134970685).jpg | CC BY 2.0 - https://creativecommons.org/licenses/by/2.0 |
| 30.webp | Rừng tràm Trà Sư / Bùi Thụy Đào Nguyên | https://commons.wikimedia.org/wiki/File:Tr%C3%A0_S%C6%B0_1.jpg | CC BY-SA 3.0 - https://creativecommons.org/licenses/by-sa/3.0 |

Changes: orientation normalized, resized to a maximum width of 1200px without upscaling, and re-encoded to WebP at quality 82. Display may crop the image. Each derivative retains its original license; credits and source links remain visible in the game.
