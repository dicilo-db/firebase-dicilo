<?php
/**
 * Plugin Name: Dicilo Gallery All-in-One
 * Plugin URI: https://dicilo.net
 * Description: Galería Multilingüe (DE, EN, ES), Formatos de imagen, Carrusel Automático, Compresión WebP y GitHub Updater.
 * Version: 3.2.1
 * Author: Dicilo Architect
 * Author URI: https://dicilo.net
 * Text Domain: dicilo-gallery
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 🔴 CONFIGURACIÓN PARA ACTUALIZACIONES SIN ZIP (VÍA GITHUB)
define('DICILO_GITHUB_USER', 'dicilo-db'); 
define('DICILO_GITHUB_REPO', 'dicilo-gallery-plugin');

if ( ! class_exists( 'Dicilo_Gallery_Plugin' ) ) {

    class Dicilo_Gallery_Plugin {

        private static $instance = null;

        public static function get_instance() {
            if ( null === self::$instance ) {
                self::$instance = new self();
            }
            return self::$instance;
        }

        private function __construct() {
            add_action( 'init', array( $this, 'register_cpt' ) );
            add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
            add_action( 'admin_init', array( $this, 'register_settings' ) );
            
            add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
            add_action( 'save_post', array( $this, 'save_meta_boxes' ) );

            add_filter( 'manage_dicilo_gallery_posts_columns', array( $this, 'add_shortcode_column' ) );
            add_action( 'manage_dicilo_gallery_posts_custom_column', array( $this, 'render_shortcode_column' ), 10, 2 );

            add_shortcode( 'dicilo_gallery', array( $this, 'render_gallery_shortcode' ) );
            add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
            add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );

            // Filtro mágico para comprimir a WebP
            add_filter( 'wp_handle_upload', array( $this, 'convert_upload_to_webp' ) );

            // Filtros para GitHub Updater
            add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'check_github_updates' ) );
            add_filter( 'plugins_api', array( $this, 'github_plugin_info' ), 20, 3 );
            add_filter( 'upgrader_source_selection', array( $this, 'github_upgrader_source' ), 10, 3 );
        }

        public function convert_upload_to_webp( $file ) {
            if ( in_array( $file['type'], array( 'image/jpeg', 'image/png' ) ) ) {
                $editor = wp_get_image_editor( $file['file'] );
                if ( ! is_wp_error( $editor ) ) {
                    $editor->set_quality( 80 );
                    $path_info = pathinfo( $file['file'] );
                    $new_filename = $path_info['dirname'] . '/' . $path_info['filename'] . '.webp';
                    $saved = $editor->save( $new_filename, 'image/webp' );
                    if ( ! is_wp_error( $saved ) ) {
                        @unlink( $file['file'] );
                        $file['file'] = $new_filename;
                        $file['type'] = 'image/webp';
                        $url_info = pathinfo( $file['url'] );
                        $file['url']  = $url_info['dirname'] . '/' . $url_info['filename'] . '.webp';
                    }
                }
            }
            return $file;
        }

        public function register_cpt() {
            $args = array(
                'labels'             => array(
                    'name'               => 'Galerías Dicilo',
                    'singular_name'      => 'Galería',
                    'menu_name'          => 'Galerías Dicilo',
                    'add_new'            => 'Crear Nueva Galería',
                ),
                'public'             => false,
                'show_ui'            => true,
                'menu_icon'          => 'dashicons-images-alt2',
                'supports'           => array( 'title' ),
            );
            register_post_type( 'dicilo_gallery', $args );
        }

        public function add_shortcode_column( $columns ) {
            $columns['gallery_shortcode'] = 'Shortcode';
            return $columns;
        }

        public function render_shortcode_column( $column, $post_id ) {
            if ( $column === 'gallery_shortcode' ) echo '<code>[dicilo_gallery id="' . $post_id . '"]</code>';
        }

        public function add_settings_page() {
            add_options_page('Ajustes Dicilo Gallery', 'Ajustes Dicilo', 'manage_options', 'dicilo-gallery-settings', array( $this, 'render_settings_page' ));
        }

        public function register_settings() {
            register_setting( 'dicilo_gallery_options_group', 'dicilo_gallery_enable_zoom' );
            register_setting( 'dicilo_gallery_options_group', 'dicilo_gallery_show_text' );
        }

        public function render_settings_page() {
            ?>
            <div class="wrap">
                <h1>Ajustes Globales de Galerías</h1>
                <form method="post" action="options.php">
                    <?php settings_fields( 'dicilo_gallery_options_group' ); ?>
                    <table class="form-table">
                        <tr valign="top">
                            <th scope="row">Activar Efecto Zoom (Hover)</th>
                            <td><input type="checkbox" name="dicilo_gallery_enable_zoom" value="1" <?php checked( 1, get_option( 'dicilo_gallery_enable_zoom', '1' ), true ); ?> /></td>
                        </tr>
                        <tr valign="top">
                            <th scope="row">Mostrar Textos sobre Imágenes</th>
                            <td><input type="checkbox" name="dicilo_gallery_show_text" value="1" <?php checked( 1, get_option( 'dicilo_gallery_show_text', '1' ), true ); ?> /></td>
                        </tr>
                    </table>
                    <?php submit_button(); ?>
                </form>
            </div>
            <?php
        }

        public function add_meta_boxes() {
            add_meta_box('dicilo_gallery_images_box', 'Configuración e Imágenes', array( $this, 'render_meta_box' ), 'dicilo_gallery', 'normal', 'high');
        }

        public function render_meta_box( $post ) {
            wp_nonce_field( 'dicilo_gallery_save_images', 'dicilo_gallery_images_nonce' );
            
            $images = get_post_meta( $post->ID, '_dicilo_gallery_images', true ) ?: array();
            $layout = get_post_meta( $post->ID, '_dicilo_gallery_layout', true ) ?: 'grid';
            $columns = get_post_meta( $post->ID, '_dicilo_gallery_columns', true ) ?: '3';
            $autoplay = get_post_meta( $post->ID, '_dicilo_gallery_autoplay', true ) ?: '0';
            $aspect = get_post_meta( $post->ID, '_dicilo_gallery_aspect_ratio', true ) ?: '1/1';
            ?>
            <style>
                .dicilo-config-bar { background: #e5f5fa; border-left: 4px solid #00a0d2; padding: 15px; margin-bottom: 20px; }
                .dicilo-image-row { background: #f9f9f9; border: 1px solid #ccd0d4; padding: 15px; margin-bottom: 15px; position: relative; }
                .dicilo-remove-row { color: #d63638; position: absolute; top: 15px; right: 15px; font-weight: bold; text-decoration: none; }
                .dicilo-preview-img { max-width: 100px; display: block; margin-top: 10px; }
                .dicilo-flex-row { display: flex; gap: 10px; margin-top: 10px; }
                .dicilo-flex-col { flex: 1; }
            </style>

            <div class="dicilo-config-bar">
                <h3>⚙️ Configuración Visual</h3>
                <p>
                    <label><strong>Modo:</strong></label>
                    <select name="dicilo_gallery_layout">
                        <option value="grid" <?php selected($layout, 'grid'); ?>>Cuadrícula Estática</option>
                        <option value="carousel" <?php selected($layout, 'carousel'); ?>>Carrusel</option>
                    </select>
                    &nbsp;&nbsp;
                    <label><strong>Columnas:</strong></label>
                    <select name="dicilo_gallery_columns">
                        <option value="1" <?php selected($columns, '1'); ?>>1</option>
                        <option value="2" <?php selected($columns, '2'); ?>>2</option>
                        <option value="3" <?php selected($columns, '3'); ?>>3</option>
                    </select>
                    &nbsp;&nbsp;
                    <label><strong>Auto-Play (Carrusel):</strong></label>
                    <select name="dicilo_gallery_autoplay">
                        <option value="0" <?php selected($autoplay, '0'); ?>>No (Manual)</option>
                        <option value="3000" <?php selected($autoplay, '3000'); ?>>Automático (3 seg)</option>
                        <option value="6000" <?php selected($autoplay, '6000'); ?>>Automático (6 seg)</option>
                        <option value="9000" <?php selected($autoplay, '9000'); ?>>Automático (9 seg)</option>
                        <option value="12000" <?php selected($autoplay, '12000'); ?>>Automático (12 seg)</option>
                    </select>
                </p>
                <p>
                    <label><strong>Proporción (Tamaño Foto):</strong></label>
                    <select name="dicilo_gallery_aspect_ratio">
                        <option value="1/1" <?php selected($aspect, '1/1'); ?>>Cuadrado (1:1 - Instagram Feed)</option>
                        <option value="4/5" <?php selected($aspect, '4/5'); ?>>Retrato (4:5 - Instagram Vertical)</option>
                        <option value="16/9" <?php selected($aspect, '16/9'); ?>>Panorámico (16:9 - YouTube/TV)</option>
                        <option value="9/16" <?php selected($aspect, '9/16'); ?>>Historia (9:16 - Reels/TikTok)</option>
                        <option value="auto" <?php selected($aspect, 'auto'); ?>>Original (Sin recortes)</option>
                    </select>
                </p>
            </div>

            <div id="dicilo-gallery-wrapper">
                <?php foreach ( $images as $index => $image ) : ?>
                <div class="dicilo-image-row">
                    <h4>Imagen #<span class="row-num"><?php echo $index + 1; ?></span></h4>
                    <a href="#" class="dicilo-remove-row">Eliminar</a>
                    <p>
                        <label><strong>URL de la Imagen:</strong></label><br>
                        <input type="text" name="dicilo_gallery_images[<?php echo $index; ?>][url]" value="<?php echo esc_attr( $image['url'] ?? '' ); ?>" class="dicilo-url-input" style="width: 70%;" />
                        <button type="button" class="button dicilo-upload-btn">Seleccionar</button>
                        <img src="<?php echo esc_url( $image['url'] ?? '' ); ?>" class="dicilo-preview-img" style="<?php echo empty($image['url']) ? 'display:none;' : ''; ?>" />
                    </p>

                    <!-- Textos Multilingües -->
                    <div class="dicilo-flex-row">
                        <div class="dicilo-flex-col">
                            <label>🇩🇪 Texto (Alemán):</label>
                            <input type="text" name="dicilo_gallery_images[<?php echo $index; ?>][text_de]" value="<?php echo esc_attr( $image['text_de'] ?? $image['text'] ?? '' ); ?>" style="width: 100%;" />
                        </div>
                        <div class="dicilo-flex-col">
                            <label>🇬🇧 Texto (Inglés):</label>
                            <input type="text" name="dicilo_gallery_images[<?php echo $index; ?>][text_en]" value="<?php echo esc_attr( $image['text_en'] ?? '' ); ?>" style="width: 100%;" />
                        </div>
                        <div class="dicilo-flex-col">
                            <label>🇪🇸 Texto (Español):</label>
                            <input type="text" name="dicilo_gallery_images[<?php echo $index; ?>][text_es]" value="<?php echo esc_attr( $image['text_es'] ?? '' ); ?>" style="width: 100%;" />
                        </div>
                    </div>

                    <!-- Enlaces Multilingües -->
                    <div class="dicilo-flex-row">
                        <div class="dicilo-flex-col">
                            <label>🔗 Enlace Global (o 🇩🇪):</label>
                            <input type="url" name="dicilo_gallery_images[<?php echo $index; ?>][link]" value="<?php echo esc_attr( $image['link'] ?? '' ); ?>" style="width: 100%;" />
                        </div>
                        <div class="dicilo-flex-col">
                            <label>🔗 Enlace 🇬🇧 (Opcional):</label>
                            <input type="url" name="dicilo_gallery_images[<?php echo $index; ?>][link_en]" value="<?php echo esc_attr( $image['link_en'] ?? '' ); ?>" style="width: 100%;" />
                        </div>
                        <div class="dicilo-flex-col">
                            <label>🔗 Enlace 🇪🇸 (Opcional):</label>
                            <input type="url" name="dicilo_gallery_images[<?php echo $index; ?>][link_es]" value="<?php echo esc_attr( $image['link_es'] ?? '' ); ?>" style="width: 100%;" />
                        </div>
                    </div>

                </div>
                <?php endforeach; ?>
            </div>
            <button type="button" id="dicilo-add-row" class="button button-primary">+ Añadir Imagen</button>
            
            <script type="text/template" id="dicilo-row-template">
                <div class="dicilo-image-row">
                    <h4>Imagen #<span class="row-num">{{id}}</span></h4>
                    <a href="#" class="dicilo-remove-row">Eliminar</a>
                    <p>
                        <label><strong>URL de la Imagen:</strong></label><br>
                        <input type="text" name="dicilo_gallery_images[{{index}}][url]" value="" class="dicilo-url-input" style="width: 70%;" />
                        <button type="button" class="button dicilo-upload-btn">Seleccionar</button>
                        <img src="" class="dicilo-preview-img" style="display:none;" />
                    </p>
                    <div class="dicilo-flex-row">
                        <div class="dicilo-flex-col"><label>🇩🇪 Texto (Alemán):</label><input type="text" name="dicilo_gallery_images[{{index}}][text_de]" value="" style="width: 100%;" /></div>
                        <div class="dicilo-flex-col"><label>🇬🇧 Texto (Inglés):</label><input type="text" name="dicilo_gallery_images[{{index}}][text_en]" value="" style="width: 100%;" /></div>
                        <div class="dicilo-flex-col"><label>🇪🇸 Texto (Español):</label><input type="text" name="dicilo_gallery_images[{{index}}][text_es]" value="" style="width: 100%;" /></div>
                    </div>
                    <div class="dicilo-flex-row">
                        <div class="dicilo-flex-col"><label>🔗 Enlace Global (o 🇩🇪):</label><input type="url" name="dicilo_gallery_images[{{index}}][link]" value="" style="width: 100%;" /></div>
                        <div class="dicilo-flex-col"><label>🔗 Enlace 🇬🇧 (Opcional):</label><input type="url" name="dicilo_gallery_images[{{index}}][link_en]" value="" style="width: 100%;" /></div>
                        <div class="dicilo-flex-col"><label>🔗 Enlace 🇪🇸 (Opcional):</label><input type="url" name="dicilo_gallery_images[{{index}}][link_es]" value="" style="width: 100%;" /></div>
                    </div>
                </div>
            </script>
            <?php
        }

        public function save_meta_boxes( $post_id ) {
            if ( ! isset( $_POST['dicilo_gallery_images_nonce'] ) || ! wp_verify_nonce( $_POST['dicilo_gallery_images_nonce'], 'dicilo_gallery_save_images' ) ) return;
            if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;

            update_post_meta( $post_id, '_dicilo_gallery_layout', sanitize_text_field( $_POST['dicilo_gallery_layout'] ?? 'grid' ) );
            update_post_meta( $post_id, '_dicilo_gallery_columns', sanitize_text_field( $_POST['dicilo_gallery_columns'] ?? '3' ) );
            update_post_meta( $post_id, '_dicilo_gallery_autoplay', sanitize_text_field( $_POST['dicilo_gallery_autoplay'] ?? '0' ) );
            update_post_meta( $post_id, '_dicilo_gallery_aspect_ratio', sanitize_text_field( $_POST['dicilo_gallery_aspect_ratio'] ?? '1/1' ) );

            $sanitized_images = array();
            if ( isset( $_POST['dicilo_gallery_images'] ) && is_array( $_POST['dicilo_gallery_images'] ) ) {
                foreach ( $_POST['dicilo_gallery_images'] as $image ) {
                    if ( ! empty( $image['url'] ) ) {
                        $sanitized_images[] = array(
                            'url'     => esc_url_raw( $image['url'] ),
                            'text_de' => sanitize_text_field( $image['text_de'] ?? '' ),
                            'text_en' => sanitize_text_field( $image['text_en'] ?? '' ),
                            'text_es' => sanitize_text_field( $image['text_es'] ?? '' ),
                            'text'    => sanitize_text_field( $image['text'] ?? '' ), // Mantener para fallback
                            'link'    => esc_url_raw( $image['link'] ?? '' ),
                            'link_en' => esc_url_raw( $image['link_en'] ?? '' ),
                            'link_es' => esc_url_raw( $image['link_es'] ?? '' ),
                        );
                    }
                }
            }
            update_post_meta( $post_id, '_dicilo_gallery_images', $sanitized_images );
        }

        public function enqueue_admin_scripts( $hook ) {
            global $typenow;
            if ( $typenow === 'dicilo_gallery' ) {
                wp_enqueue_media();
                wp_add_inline_script( 'jquery', '
                    jQuery(document).ready(function($){
                        var frame;
                        $("body").on("click", ".dicilo-upload-btn", function(e) {
                            e.preventDefault();
                            var button = $(this); var input = button.prev(".dicilo-url-input"); var img = button.next(".dicilo-preview-img");
                            if ( frame ) { frame.open(); return; }
                            frame = wp.media({ title: "Seleccionar Imagen", multiple: false });
                            frame.on("select", function() {
                                var attachment = frame.state().get("selection").first().toJSON();
                                input.val(attachment.url); img.attr("src", attachment.url).show();
                            });
                            frame.open();
                        });
                        var rowCount = $(".dicilo-image-row").length;
                        $("#dicilo-add-row").click(function(e) {
                            e.preventDefault(); var template = $("#dicilo-row-template").html();
                            template = template.replace(/{{index}}/g, rowCount).replace(/{{id}}/g, rowCount + 1);
                            $("#dicilo-gallery-wrapper").append(template); rowCount++;
                        });
                        $("body").on("click", ".dicilo-remove-row", function(e) {
                            e.preventDefault(); $(this).closest(".dicilo-image-row").remove();
                        });
                    });
                ' );
            }
        }

        public function enqueue_frontend_assets() {
            wp_enqueue_style( 'swiper-css', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css' );
            wp_enqueue_script( 'swiper-js', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', array(), null, true );

            $enable_zoom = get_option( 'dicilo_gallery_enable_zoom', '1' );
            $custom_css = "
                .dicilo-gallery-item { position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .dicilo-gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease-in-out; }
                .dicilo-gallery-text { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: #fff; padding: 10px; text-align: center; }
                .dicilo-gallery-grid { display: grid; gap: 20px; padding: 20px 0; }
                .dicilo-grid-cols-1 { grid-template-columns: 1fr; }
                .dicilo-grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .dicilo-grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                .swiper-pagination-bullet-active { background: #000; }
                @media (max-width: 768px) { .dicilo-grid-cols-2, .dicilo-grid-cols-3 { grid-template-columns: 1fr !important; } }
            ";
            if ( $enable_zoom ) $custom_css .= ".dicilo-gallery-item:hover img { transform: scale(1.05); }";
            
            wp_register_style( 'dicilo-gallery-custom-style', false );
            wp_enqueue_style( 'dicilo-gallery-custom-style' );
            wp_add_inline_style( 'dicilo-gallery-custom-style', $custom_css );
        }

        public function render_gallery_shortcode( $atts ) {
            $atts = shortcode_atts( array( 'id' => '' ), $atts );
            if ( empty( $atts['id'] ) ) return '';

            $post_id = intval( $atts['id'] );
            $images = get_post_meta( $post_id, '_dicilo_gallery_images', true );
            $layout = get_post_meta( $post_id, '_dicilo_gallery_layout', true ) ?: 'grid';
            $columns = get_post_meta( $post_id, '_dicilo_gallery_columns', true ) ?: '3';
            $autoplay = get_post_meta( $post_id, '_dicilo_gallery_autoplay', true ) ?: '0';
            $aspect = get_post_meta( $post_id, '_dicilo_gallery_aspect_ratio', true ) ?: '1/1';
            $show_text = get_option( 'dicilo_gallery_show_text', '1' );

            if ( empty( $images ) ) return '';

            ob_start();

            if ( $layout === 'grid' ) {
                echo '<div class="dicilo-gallery-grid dicilo-grid-cols-' . esc_attr( $columns ) . '">';
                foreach ( $images as $image ) {
                    if ( !empty( $image['url'] ) ) $this->render_single_item( $image, $show_text, $aspect );
                }
                echo '</div>';
            } else {
                $unique_id = 'swiper-' . wp_rand(1000, 9999);
                echo '<div class="swiper dicilo-gallery-carousel ' . $unique_id . '"><div class="swiper-wrapper">';
                foreach ( $images as $image ) {
                    if ( !empty( $image['url'] ) ) {
                        echo '<div class="swiper-slide">';
                        $this->render_single_item( $image, $show_text, $aspect );
                        echo '</div>';
                    }
                }
                echo '</div><div class="swiper-pagination"></div></div>';

                ?>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        let opts = {
                            slidesPerView: 1, spaceBetween: 20,
                            pagination: { el: '.swiper-pagination', clickable: true },
                            breakpoints: { 768: { slidesPerView: <?php echo esc_js( $columns ); ?> } }
                        };
                        <?php if ( intval( $autoplay ) > 0 ) : ?>
                        opts.autoplay = { delay: <?php echo intval( $autoplay ); ?>, disableOnInteraction: false };
                        <?php endif; ?>
                        new Swiper('.<?php echo $unique_id; ?>', opts);
                    });
                </script>
                <?php
            }
            return ob_get_clean();
        }

        private function render_single_item( $image, $show_text, $aspect ) {
            $style = ($aspect !== 'auto') ? 'aspect-ratio: ' . esc_attr($aspect) . ';' : '';
            
            // 🌐 DETECCIÓN INTELIGENTE DE IDIOMA
            $lang = substr( get_locale(), 0, 2 ); // Retorna 'de', 'en', 'es', etc.
            if ( defined('ICL_LANGUAGE_CODE') ) {
                $lang = ICL_LANGUAGE_CODE; // Soporte especial si usan WPML
            }
            
            // Elegir el texto correcto según el idioma detectado
            $display_text = '';
            if ( $lang === 'en' && !empty($image['text_en']) ) $display_text = $image['text_en'];
            elseif ( $lang === 'es' && !empty($image['text_es']) ) $display_text = $image['text_es'];
            elseif ( !empty($image['text_de']) ) $display_text = $image['text_de']; // DE o prioridad si no hay otro
            elseif ( !empty($image['text']) ) $display_text = $image['text']; // Soporte para galerías viejas

            // Elegir el enlace correcto según el idioma detectado
            $display_link = '';
            if ( $lang === 'en' && !empty($image['link_en']) ) $display_link = $image['link_en'];
            elseif ( $lang === 'es' && !empty($image['link_es']) ) $display_link = $image['link_es'];
            elseif ( !empty($image['link']) ) $display_link = $image['link']; // Enlace general/DE si los otros están vacíos

            echo '<div class="dicilo-gallery-item" style="' . $style . '">';
            if ( ! empty( $display_link ) ) echo '<a href="' . esc_url( $display_link ) . '" target="_blank">';
            echo '<img src="' . esc_url( $image['url'] ) . '" alt="' . esc_attr( $display_text ) . '" />';
            if ( $show_text && ! empty( $display_text ) ) echo '<div class="dicilo-gallery-text">' . esc_html( $display_text ) . '</div>';
            if ( ! empty( $display_link ) ) echo '</a>';
            echo '</div>';
        }

        public function check_github_updates( $transient ) {
            if ( empty( $transient->checked ) ) return $transient;
            
            $repo = DICILO_GITHUB_USER . '/' . DICILO_GITHUB_REPO;
            $url = "https://api.github.com/repos/{$repo}/releases/latest";
            $response = wp_remote_get( $url, array( 'headers' => array( 'Accept' => 'application/vnd.github.v3+json' ) ) );
            
            if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
                $release = json_decode( wp_remote_retrieve_body( $response ) );
                $new_version = ltrim( $release->tag_name, 'v' );
                $plugin_slug = plugin_basename( __FILE__ );
                
                // Aseguramos de que el actualizador sepa que ahora estamos en la 3.2.1
                if ( version_compare( $new_version, '3.2.1', '>' ) ) {
                    $obj = new stdClass();
                    $obj->slug = $plugin_slug;
                    $obj->new_version = $new_version;
                    $obj->url = $release->html_url;
                    $obj->package = $release->zipball_url;
                    $transient->response[$plugin_slug] = $obj;
                }
            }
            return $transient;
        }

        public function github_plugin_info( $false, $action, $response ) {
            if ( $action !== 'plugin_information' ) return $false;
            if ( $response->slug !== plugin_basename( __FILE__ ) ) return $false;
            
            $repo = DICILO_GITHUB_USER . '/' . DICILO_GITHUB_REPO;
            $url = "https://api.github.com/repos/{$repo}/releases/latest";
            $api = wp_remote_get( $url );
            if ( ! is_wp_error( $api ) && wp_remote_retrieve_response_code( $api ) === 200 ) {
                $release = json_decode( wp_remote_retrieve_body( $api ) );
                $response->name = 'Dicilo Gallery All-in-One';
                $response->version = ltrim( $release->tag_name, 'v' );
                $response->download_link = $release->zipball_url;
                return $response;
            }
            return $false;
        }

        public function github_upgrader_source( $source, $remote_source, $upgrader ) {
            global $wp_filesystem;
            if ( strpos( $source, DICILO_GITHUB_REPO ) !== false ) {
                $plugin_folder = dirname( plugin_basename( __FILE__ ) );
                if ( $plugin_folder === '.' ) return $source;
                
                $new_source = trailingslashit( $remote_source ) . $plugin_folder;
                if ( $wp_filesystem->move( $source, $new_source, true ) ) {
                    return trailingslashit( $new_source );
                }
            }
            return $source;
        }
    }

}

if ( class_exists( 'Dicilo_Gallery_Plugin' ) ) {
    Dicilo_Gallery_Plugin::get_instance();
}
